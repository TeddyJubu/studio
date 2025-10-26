"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, Bell, Mail, MessageSquare, CheckCircle2 } from "lucide-react";

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
  const [contactMethod, setContactMethod] = useState<"sms" | "email" | "both">("both");
  const [flexibleTimes, setFlexibleTimes] = useState<string[]>(
    requestedTime ? [] : TIME_SLOTS
  );
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleFlexibleTime = (time: string) => {
    setFlexibleTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      return;
    }

    if (contactMethod !== "sms" && !email.trim()) {
      return;
    }

    const data: WaitlistFormData = {
      customerName: name,
      customerEmail: email || undefined,
      customerPhone: phone,
      requestedDate,
      requestedTime,
      partySize,
      flexibleTimes,
      flexibleDates: [], // For now, only same date
      contactMethod,
      notes: notes.trim() || undefined,
    };

    onSubmit(data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="my-2 max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>You're on the Waitlist!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            We'll notify you as soon as a table becomes available for:
          </p>

          <div className="space-y-2 rounded-lg bg-muted p-4 text-left">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{formatDate(requestedDate)}</span>
            </div>
            {requestedTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>{formatTime(requestedTime)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span>{partySize} guests</span>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium">What happens next?</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>✓ We'll monitor availability continuously</li>
              <li>✓ You'll be notified immediately when a slot opens</li>
              <li>✓ You'll have 15 minutes to confirm your booking</li>
              <li>✓ Your waitlist entry expires in 7 days</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            You'll receive notifications via {contactMethod === "both" ? "SMS and email" : contactMethod === "sms" ? "SMS" : "email"}.
          </p>

          <Button onClick={onCancel} variant="outline" className="w-full">
            Return to Chat
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-2 max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Join the Waitlist
        </CardTitle>
        <CardDescription>
          We'll notify you when a table becomes available
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Requested Details Summary */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <p className="text-sm font-semibold">Looking for:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                <span>{new Date(requestedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
              {requestedTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span>{formatTime(requestedTime)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-primary" />
                <span>{partySize} guests</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Contact Method */}
          <div className="space-y-2">
            <Label>How should we contact you?</Label>
            <RadioGroup value={contactMethod} onValueChange={(value: any) => setContactMethod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="contact-both" />
                <Label htmlFor="contact-both" className="font-normal cursor-pointer flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <Mail className="h-4 w-4" />
                  SMS & Email (Recommended)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="contact-sms" />
                <Label htmlFor="contact-sms" className="font-normal cursor-pointer flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="contact-email" />
                <Label htmlFor="contact-email" className="font-normal cursor-pointer flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Only
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Flexible Times */}
          {!requestedTime && (
            <div className="space-y-2">
              <Label>Select all acceptable times</Label>
              <p className="text-xs text-muted-foreground mb-2">
                The more flexible you are, the sooner we can accommodate you
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((time) => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      id={`time-${time}`}
                      checked={flexibleTimes.includes(time)}
                      onCheckedChange={() => toggleFlexibleTime(time)}
                    />
                    <Label
                      htmlFor={`time-${time}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      {formatTime(time)}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFlexibleTimes(TIME_SLOTS)}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFlexibleTimes([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {requestedTime && (
            <div className="space-y-2">
              <Label>Also accept these alternative times?</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Optional - increases your chances
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.filter((t) => t !== requestedTime).map((time) => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      id={`alt-time-${time}`}
                      checked={flexibleTimes.includes(time)}
                      onCheckedChange={() => toggleFlexibleTime(time)}
                    />
                    <Label
                      htmlFor={`alt-time-${time}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      {formatTime(time)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="e.g., Can arrive 15 mins early, prefer window seat"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Info Box */}
          <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-2">
            <p className="font-medium">Important Information:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• You'll be notified as soon as a table opens</li>
              <li>• Response window: 15 minutes to confirm</li>
              <li>• Waitlist entry expires after 7 days</li>
              <li>• {flexibleTimes.length > 1 ? `${flexibleTimes.length} time slots selected` : "Select more times to increase chances"}</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={!name.trim() || !phone.trim() || (contactMethod !== "sms" && !email.trim())}
            >
              Join Waitlist
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
