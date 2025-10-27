"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface WaitlistFormProps {
  requestedDate: string;
  requestedTime?: string;
  partySize: number;
  onSubmit: (data: WaitlistFormData) => void;
  onCancel?: () => void;
}

export interface WaitlistFormData {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  requestedDate: string;
  requestedTime?: string;
  partySize: number;
  flexibleTimes: string[];
  flexibleDates: string[];
  contactMethod: "sms" | "email" | "both";
  notes?: string;
}

const TIME_SLOTS = [
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const [hourString, minute = "00"] = value.split(":");
  const hour = Number(hourString);
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const safeHour = ((hour + 11) % 12) + 1;
  return `${safeHour}:${minute.padStart(2, "0")} ${suffix}`;
}

export function WaitlistForm({
  requestedDate,
  requestedTime,
  partySize,
  onSubmit,
  onCancel,
}: WaitlistFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState<"sms" | "email" | "both">(
    "both",
  );
  const [flexibleTimes, setFlexibleTimes] = useState<string[]>(
    requestedTime ? [] : TIME_SLOTS,
  );
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const summaryCopy = useMemo(
    () =>
      `${formatDate(requestedDate)}${
        requestedTime ? ` at ${formatTime(requestedTime)}` : ""
      } • ${partySize} guests`,
    [requestedDate, requestedTime, partySize],
  );

  const toggleFlexibleTime = (time: string) => {
    setFlexibleTimes((prev) =>
      prev.includes(time)
        ? prev.filter((slot) => slot !== time)
        : [...prev, time],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    if (contactMethod !== "sms" && !email.trim()) return;

    const payload: WaitlistFormData = {
      customerName: name.trim(),
      customerEmail: email.trim() || undefined,
      customerPhone: phone.trim(),
      requestedDate,
      requestedTime,
      partySize,
      flexibleTimes,
      flexibleDates: [],
      contactMethod,
      notes: notes.trim() || undefined,
    };

    onSubmit(payload);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="my-4 max-w-xl overflow-hidden rounded-3xl border border-success/30 bg-success/5 shadow-lg backdrop-blur">
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-success">
              You're on the waitlist
            </CardTitle>
            <CardDescription className="mt-2 text-base text-success/80">
              We'll reach out the moment a table opens up.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-success/70">
              Requested experience
            </p>
            <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-success">
              {summaryCopy}
            </div>
          </div>

          <div className="rounded-2xl border border-success/30 bg-background/80 p-4 text-left text-sm text-success">
            <p className="font-semibold">What happens next?</p>
            <ul className="mt-3 space-y-1.5 text-xs font-medium">
              <li>• We're monitoring availability in real time.</li>
              <li>• You'll receive an alert the moment a slot opens.</li>
              <li>• You'll have 15 minutes to confirm your table.</li>
              <li>• We'll keep you on the list for 7 days.</li>
            </ul>
          </div>

          <p className="text-xs text-success/70">
            Notifications will arrive via{" "}
            {contactMethod === "both"
              ? "SMS and email"
              : contactMethod === "sms"
                ? "SMS"
                : "email"}
            .
          </p>

          {onCancel ? (
            <Button variant="outline" onClick={onCancel}>
              Return to chat
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-4 max-w-xl overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-lg backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-xs font-medium uppercase tracking-wide text-primary"
          >
            Concierge Assist
          </Badge>
        </div>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-xl font-semibold">
            Waitlist a reservation
          </CardTitle>
          <CardDescription>
            Let us know how to reach you and when you can join us. We'll do the
            rest.
          </CardDescription>
        </div>
      </CardHeader>

      <Separator className="bg-border/70" />

      <CardContent className="space-y-6 pt-6">
        <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Request summary
          </p>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{formatDate(requestedDate)}</span>
            </div>
            {requestedTime ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{formatTime(requestedTime)}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-2">
              <Users className="h-4 w-4 text-primary" />
              <span>{partySize} guests</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guest-name">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guest-name"
                placeholder="Jordan Castillo"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-phone">
                Mobile number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guest-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="guest-email">Email</Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>How should we contact you?</Label>
            <RadioGroup
              value={contactMethod}
              onValueChange={(value: "sms" | "email" | "both") =>
                setContactMethod(value)
              }
              className="grid gap-3 sm:grid-cols-3"
            >
              <label
                htmlFor="contact-both"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm font-medium hover:border-primary/40"
              >
                <RadioGroupItem id="contact-both" value="both" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <Mail className="h-4 w-4" />
                  SMS & Email
                </div>
              </label>
              <label
                htmlFor="contact-sms"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm font-medium hover:border-primary/40"
              >
                <RadioGroupItem id="contact-sms" value="sms" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  SMS Only
                </div>
              </label>
              <label
                htmlFor="contact-email"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm font-medium hover:border-primary/40"
              >
                <RadioGroupItem id="contact-email" value="email" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email Only
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>
              Flexibility window{" "}
              <span className="text-muted-foreground">
                (check all times that work)
              </span>
            </Label>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {TIME_SLOTS.map((time) => {
                const isDisabled = requestedTime
                  ? time === requestedTime
                  : false;
                const isChecked = flexibleTimes.includes(time);
                return (
                  <label
                    key={time}
                    htmlFor={`flex-${time}`}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium hover:border-primary/40"
                  >
                    <Checkbox
                      id={`flex-${time}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={() => toggleFlexibleTime(time)}
                    />
                    <span className="text-muted-foreground">
                      {formatTime(time)}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFlexibleTimes(TIME_SLOTS)}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFlexibleTimes([])}
              >
                Clear selection
              </Button>
              <Badge
                variant="outline"
                className="border-border/60 bg-background/70 text-xs font-medium text-muted-foreground"
              >
                {flexibleTimes.length} time slots selected
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes for the host</Label>
            <Textarea
              id="notes"
              placeholder="Optional: let us know about arrival windows, seating preferences, or celebrations."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">What to expect</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>
                • You'll receive real-time updates if a matching slot appears.
              </li>
              <li>• Confirmation window: 15 minutes after we notify you.</li>
              <li>
                • Your waitlist request expires after 7 days to keep things
                fresh.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            {onCancel ? (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                !phone.trim() ||
                (contactMethod !== "sms" && !email.trim())
              }
            >
              Join waitlist
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
