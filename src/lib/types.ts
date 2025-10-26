import type { parseBookingDetails } from "@/ai/flows/parse-booking-details";
import type { z } from "zod";

export type BookingDetails = z.infer<typeof parseBookingDetails.outputSchema>;

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  component?: React.ReactNode;
  context?:
    | {
        type: 'booking_suggestion';
        details: BookingDetails;
      }
    | {
        type: 'booking_confirmed';
        details: BookingDetails;
      };
}
