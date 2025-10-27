"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Booking } from "@/services/booking-service";

interface ModificationFlowProps {
  booking: Booking;
  onModify: (updates: {
    date?: string;
    time?: string;
    partySize?: number;
  }) => Promise<void>;
  onCancel: (reason?: string) => Promise<void>;
  onClose: () => void;
}

type Mode = "overview" | "edit" | "cancel";
type Banner = { variant: "success" | "destructive"; message: string } | null;

const STATUS_BADGE: Record<
  Booking["status"] | "default",
  { label: string; className: string }
> = {
  confirmed: {
    label: "Confirmed",
    className: "border-success/40 bg-success/15 text-success",
  },
  pending: {
    label: "Pending Confirmation",
    className: "border-amber-300/60 bg-amber-50 text-amber-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  completed: {
    label: "Completed",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  seated: {
    label: "Seated",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  no_show: {
    label: "No Show",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  default: {
    label: "Reservation",
    className: "border-border/60 bg-muted/40 text-muted-foreground",
  },
};

function formatDate(value?: string) {
  if (!value) return "Not set";
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatTime(value?: string) {
  if (!value) return "Not set";
  const [hourString, minute = "00"] = value.split(":");
  const hour = Number(hourString);
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const safeHour = ((hour + 11) % 12) + 1;
  return `${safeHour}:${minute.padStart(2, "0")} ${suffix}`;
}

export function ModificationFlow({
  booking,
  onModify,
  onCancel,
  onClose,
}: ModificationFlowProps) {
  const [mode, setMode] = useState<Mode>("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const [snapshot, setSnapshot] = useState<Booking>(booking);
  const [newDate, setNewDate] = useState(booking.date ?? "");
  const [newTime, setNewTime] = useState(booking.time ?? "");
  const [newPartySize, setNewPartySize] = useState(booking.partySize ?? 2);

  useEffect(() => {
    setSnapshot(booking);
    setNewDate(booking.date ?? "");
    setNewTime(booking.time ?? "");
    setNewPartySize(booking.partySize ?? 2);
  }, [booking]);

  const statusTheme =
    STATUS_BADGE[snapshot.status ?? "default"] ?? STATUS_BADGE.default;

  const detailRows = useMemo(
    () => [
      {
        icon: Users,
        label: "Party Size",
        value: snapshot.partySize ? `${snapshot.partySize} guests` : "Not set",
      },
      {
        icon: Calendar,
        label: "Date",
        value: snapshot.date ? formatDate(snapshot.date) : "Not set",
      },
      {
        icon: Clock,
        label: "Time",
        value: snapshot.time ? formatTime(snapshot.time) : "Not set",
      },
    ],
    [snapshot.partySize, snapshot.date, snapshot.time],
  );

  const handleModifySubmit = async () => {
    setIsLoading(true);
    setBanner(null);

    try {
      const updates: { date?: string; time?: string; partySize?: number } = {};
      if (newDate && newDate !== snapshot.date) updates.date = newDate;
      if (newTime && newTime !== snapshot.time) updates.time = newTime;
      if (newPartySize && newPartySize !== snapshot.partySize) {
        updates.partySize = newPartySize;
      }

      if (Object.keys(updates).length === 0) {
        setBanner({
          variant: "destructive",
          message: "No changes detected. Adjust a field before submitting.",
        });
        setIsLoading(false);
        return;
      }

      await onModify(updates);
      setSnapshot((prev) => ({
        ...prev,
        ...updates,
      }));
      setBanner({
        variant: "success",
        message: "Booking updated successfully.",
      });
      setMode("overview");
    } catch (error) {
      setBanner({
        variant: "destructive",
        message:
          error instanceof Error
            ? error.message
            : "We couldn't update the booking. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubmit = async () => {
    setIsLoading(true);
    setBanner(null);

    try {
      await onCancel(cancellationReason.trim() || undefined);
      setSnapshot((prev) => ({
        ...prev,
        status: "cancelled",
        cancelledAt: new Date(),
      }));
      setBanner({
        variant: "success",
        message: "Reservation cancelled. We'll reopen the chat for next steps.",
      });
      setTimeout(() => onClose(), 600);
    } catch (error) {
      setBanner({
        variant: "destructive",
        message:
          error instanceof Error
            ? error.message
            : "We couldn't cancel the booking. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const overviewBanner =
    banner && mode === "overview" ? (
      <Alert variant={banner.variant === "success" ? "default" : "destructive"}>
        {banner.variant === "success" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertDescription>{banner.message}</AlertDescription>
      </Alert>
    ) : null;

  if (mode === "edit") {
    return (
      <Card className="my-3 max-w-md overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-lg backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">
              Adjust Reservation
            </CardTitle>
            <CardDescription>
              Update the details and we'll confirm availability instantly.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setMode("overview");
              setBanner(null);
              setNewDate(snapshot.date ?? "");
              setNewTime(snapshot.time ?? "");
              setNewPartySize(snapshot.partySize ?? 2);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <Separator className="bg-border/70" />

        <CardContent className="space-y-4 pt-4">
          {banner && banner.variant === "destructive" ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{banner.message}</AlertDescription>
            </Alert>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleModifySubmit();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="party-size">Party size</Label>
              <Input
                id="party-size"
                type="number"
                min="1"
                max="20"
                value={newPartySize}
                onChange={(event) =>
                  setNewPartySize(Number.parseInt(event.target.value, 10) || 1)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reservation-date">Date</Label>
              <Input
                id="reservation-date"
                type="date"
                value={newDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => setNewDate(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reservation-time">Time</Label>
              <Input
                id="reservation-time"
                type="time"
                value={newTime}
                onChange={(event) => setNewTime(event.target.value)}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Adjustments depend on availability. We’ll keep your original
                booking until the new details are confirmed.
              </AlertDescription>
            </Alert>

            <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-muted/40 p-0 pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setMode("overview");
                  setBanner(null);
                  setNewDate(snapshot.date ?? "");
                  setNewTime(snapshot.time ?? "");
                  setNewPartySize(snapshot.partySize ?? 2);
                }}
              >
                Keep current booking
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Save changes"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (mode === "cancel") {
    return (
      <Card className="my-3 max-w-md overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-lg backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold text-destructive">
              Cancel reservation
            </CardTitle>
            <CardDescription>
              The table will immediately become available for other guests.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setMode("overview");
              setBanner(null);
              setCancellationReason("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <Separator className="bg-border/70" />

        <CardContent className="space-y-4 pt-4">
          {banner && banner.variant === "destructive" ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{banner.message}</AlertDescription>
            </Alert>
          ) : null}

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You're about to cancel a table for{" "}
              {snapshot.partySize
                ? `${snapshot.partySize} guests`
                : "your party"}{" "}
              on{" "}
              {snapshot.date ? formatDate(snapshot.date) : "the selected date"}{" "}
              at{" "}
              {snapshot.time ? formatTime(snapshot.time) : "the selected time"}.
              This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <Label htmlFor="cancel-reason">
              Reason for cancellation{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="cancel-reason"
              placeholder="Change of plans, duplicate booking, schedule conflict..."
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-muted/40 p-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setMode("overview");
              setBanner(null);
              setCancellationReason("");
            }}
            disabled={isLoading}
          >
            Keep reservation
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              void handleCancelSubmit();
            }}
            disabled={isLoading}
          >
            {isLoading ? "Cancelling..." : "Confirm cancellation"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="my-3 max-w-md overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-lg backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-lg font-semibold">
            Reservation overview
          </CardTitle>
          <CardDescription>
            Confirmation • {snapshot.confirmationCode}
          </CardDescription>
        </div>
        <Badge variant="outline" className={statusTheme.className}>
          {statusTheme.label}
        </Badge>
      </CardHeader>

      <Separator className="bg-border/70" />

      <CardContent className="space-y-4 pt-4">
        {overviewBanner}

        <div className="grid gap-3">
          {detailRows.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {snapshot.occasion ? (
          <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Occasion
            </p>
            <p className="mt-1 text-foreground">{snapshot.occasion}</p>
          </div>
        ) : null}

        {snapshot.specialRequests ? (
          <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Special requests
            </p>
            <p className="mt-1 text-foreground">{snapshot.specialRequests}</p>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-muted/40 p-4 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={() => setMode("edit")}
          disabled={
            snapshot.status === "cancelled" || snapshot.status === "completed"
          }
        >
          Modify reservation
        </Button>
        <Button
          variant="destructive"
          onClick={() => setMode("cancel")}
          disabled={
            snapshot.status === "cancelled" || snapshot.status === "completed"
          }
        >
          Cancel reservation
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}
