"use client";

import type { AppointmentDetails } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calendar, Clock, PenSquare, CheckCircle } from "lucide-react";

interface AppointmentDisplayProps {
  details: AppointmentDetails;
  confirmed?: boolean;
}

export function AppointmentDisplay({ details, confirmed = false }: AppointmentDisplayProps) {
  const formattedDate = details.date ? new Date(details.date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : "Not specified";

  return (
    <div className="mt-2 text-card-foreground">
        <div className="space-y-3 p-3 text-sm">
            <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PenSquare className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Purpose</p>
                <p className="font-medium capitalize">
                  <code className="font-code rounded-sm bg-primary/10 px-1 py-0.5 text-primary">
                    {details.purpose || "Not specified"}
                  </code>
                </p>
            </div>
            </div>
            <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formattedDate}</p>
            </div>
            </div>
            <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium">{details.time || "Not specified"}</p>
            </div>
            </div>
        </div>
        {confirmed && (
            <div className="border-t bg-accent/20 px-4 py-2">
                <div className="flex items-center gap-2 text-accent">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-sm font-semibold">Appointment Confirmed. A calendar invite has been sent.</p>
                </div>
            </div>
        )}
    </div>
  );
}
