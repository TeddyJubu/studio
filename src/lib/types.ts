import type { z } from "zod";
import type { Booking } from "@/services/booking-service";
import type { MenuItem } from "@/services/menu-service";
import type { SentimentAnalysis } from "@/ai/flows/analyze-sentiment";

export interface DietaryPreferences {
  dietaryRestrictions: string[]; // e.g., ["vegetarian", "vegan", "gluten-free"]
  allergens: string[]; // e.g., ["peanuts", "shellfish", "dairy"]
  preferences: string[]; // e.g., ["kosher", "halal", "organic"]
  notes?: string; // Additional dietary notes
}

export interface BookingDetails {
  partySize?: number;
  date?: string;
  time?: string;
  occasion?: string;
  specialRequests?: string;
  availableSlots?: string[];
  dietaryPreferences?: DietaryPreferences;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  component?: React.ReactNode;
  sentiment?: SentimentAnalysis;
  context?:
    | {
        type: "booking_suggestion";
        details: BookingDetails;
      }
    | {
        type: "booking_confirmed";
        details: BookingDetails;
        confirmationCode?: string;
      }
    | {
        type: "booking_found";
        booking: Booking;
        intent: "lookup" | "modify" | "cancel";
      }
    | {
        type: "menu_query";
        items: MenuItem[];
        query: string;
      }
    | {
        type: "loyalty_status";
        points: number;
        tier: string;
      }
    | {
        type: "pricing_info";
        basePrice: number;
        finalPrice: number;
        breakdown: string;
      }
    | {
        type: "error";
        errorType:
          | "ai_failure"
          | "network_error"
          | "validation_error"
          | "booking_conflict";
        retryable: boolean;
      };
}
