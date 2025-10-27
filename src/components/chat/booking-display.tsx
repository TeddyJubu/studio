"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  Pencil,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BookingDetails } from "@/lib/types";

interface BookingDisplayProps {
  details: BookingDetails;
  confirmed?: boolean;
}

const DETAIL_ICON_MAP = {
  "Party Size": Users,
  Date: Calendar,
  Time: Clock,
  Occasion: Gift,
  "Special Requests": Pencil,
} as const;

function formatDate(value?: string) {
  if (!value) return "Not set";
  try {
    return new Date(`${value}T00:00:00`)
      .toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .replaceAll(",", "");
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

export function BookingDisplay({
  details,
  confirmed = false,
}: BookingDisplayProps) {
  const detailEntries: Array<[keyof typeof DETAIL_ICON_MAP, string]> = [
    [
      "Party Size",
      details.partySize ? `${details.partySize} guests` : "Not set",
    ],
    ["Date", formatDate(details.date)],
    ["Time", formatTime(details.time)],
    ["Occasion", details.occasion ?? "None"],
    [
      "Special Requests",
      details.specialRequests?.trim().length
        ? details.specialRequests
        : "No special requests",
    ],
  ];

  const availableSlots = details.availableSlots ?? [];

  return (
    <div className="mt-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-lg shadow-black/5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reservation Summary
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {details.customerName ?? "Guest"} • {details.partySize ?? "—"} seats
          </p>
          <p className="text-xs text-muted-foreground">
            {details.customerEmail ??
              details.customerPhone ??
              "Contact not provided"}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            confirmed
              ? "border-success/40 bg-success/15 text-success"
              : "border-primary/40 bg-primary/10 text-primary"
          }
        >
          {confirmed ? "Confirmed" : "Awaiting Confirmation"}
        </Badge>
      </div>

      <Separator className="my-4 bg-border/60" />

      <div className="grid gap-3 text-sm">
        {detailEntries.map(([label, value]) => {
          const Icon = DETAIL_ICON_MAP[label];
          return (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 font-medium text-foreground">{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {availableSlots.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Suggested alternative times
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((slot) => (
              <Badge
                key={slot}
                variant="outline"
                className="rounded-full border-border/50 bg-transparent px-3 py-1 text-xs font-medium text-foreground"
              >
                {slot}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {confirmed ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
          <CheckCircle2 className="h-4 w-4" />
          Booking locked in. We can’t wait to host you!
        </div>
      ) : null}
    </div>
  );
}
