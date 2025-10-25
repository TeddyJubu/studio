import type { parseAppointmentPreferences } from "@/ai/flows/intelligent-appointment-parsing";
import type { z } from "zod";

export type AppointmentDetails = z.infer<typeof parseAppointmentPreferences.outputSchema>;

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  component?: React.ReactNode;
  context?:
    | {
        type: 'appointment_suggestion';
        details: AppointmentDetails;
      }
    | {
        type: 'appointment_confirmed';
        details: AppointmentDetails;
      }
}
