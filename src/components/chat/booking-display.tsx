"use client";

import type { BookingDetails } from "@/lib/types";
import { Calendar, Clock, Users, Gift, Pencil, CheckCircle } from "lucide-react";

interface BookingDisplayProps {
  details: BookingDetails;
  confirmed?: boolean;
}

export function BookingDisplay({ details, confirmed = false }: BookingDisplayProps) {
  const formattedDate = details.date ? new Date(details.date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : "Not specified";

  const detailItems = [
    {
      icon: Users,
      label: "Party Size",
      value: details.partySize?.toString()
    },
    {
      icon: Calendar,
      label: "Date",
      value: formattedDate
    },
    {
      icon: Clock,
      label: "Time",
      value: details.time
    },
    {
      icon: Gift,
      label: "Occasion",
      value: details.occasion
    },
    {
      icon: Pencil,
      label: "Special Requests",
      value: details.specialRequests
    },
  ];

  return (
    <div className="mt-2 text-card-foreground">
        <div className="space-y-3 p-3 text-sm">
          {detailItems.map((item, index) => item.value ? (
            <div key={index} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
              </div>
              <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-medium capitalize">
                    {item.value}
                  </p>
              </div>
            </div>
          ): null)}
        </div>
        {confirmed && (
            <div className="border-t bg-accent/20 px-4 py-2">
                <div className="flex items-center gap-2 text-accent">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-sm font-semibold">Booking Confirmed. We look forward to seeing you!</p>
                </div>
            </div>
        )}
    </div>
  );
}
