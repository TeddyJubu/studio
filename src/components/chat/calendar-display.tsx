"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

interface CalendarDisplayProps {
  availableSlots: string[];
}

export function CalendarDisplay({ availableSlots }: CalendarDisplayProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const availableDays = availableSlots.map(slot => new Date(slot + 'T00:00:00'));

  const isDayAvailable = (day: Date) => {
    return availableDays.some(
      availableDay =>
        day.getFullYear() === availableDay.getFullYear() &&
        day.getMonth() === availableDay.getMonth() &&
        day.getDate() === availableDay.getDate()
    );
  };

  return (
    <div className="mt-2 flex justify-center">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
        modifiers={{
          available: isDayAvailable,
        }}
        modifiersStyles={{
          available: {
            color: 'hsl(var(--primary-foreground))',
            backgroundColor: 'hsl(var(--primary))',
          },
        }}
      />
    </div>
  );
}
