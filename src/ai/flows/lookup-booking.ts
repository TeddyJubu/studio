'use server';

/**
 * @fileOverview AI flow for looking up existing bookings.
 *
 * - lookupBooking - A function that finds bookings based on user input.
 * - LookupBookingInput - The input type for the lookupBooking function.
 * - LookupBookingOutput - The return type for the lookupBooking function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getBookingByConfirmationCode } from '@/services/booking-service';

const LookupBookingInputSchema = z.object({
  userInput: z.string().describe('The user input containing booking lookup information.'),
});
export type LookupBookingInput = z.infer<typeof LookupBookingInputSchema>;

const LookupBookingOutputSchema = z.object({
  confirmationCode: z.string().optional().describe('The booking confirmation code extracted from user input.'),
  email: z.string().optional().describe('The customer email address.'),
  phone: z.string().optional().describe('The customer phone number.'),
  name: z.string().optional().describe('The customer name.'),
  intent: z.enum(['lookup', 'modify', 'cancel']).describe('What the user wants to do with the booking.'),
});
export type LookupBookingOutput = z.infer<typeof LookupBookingOutputSchema>;

const lookupBookingTool = ai.defineTool(
  {
    name: 'lookupBookingByConfirmationCode',
    description: 'Look up a booking using the confirmation code.',
    inputSchema: z.object({
      confirmationCode: z.string().describe('The 8-character confirmation code (e.g., ABC12345).'),
    }),
    outputSchema: z.object({
      found: z.boolean(),
      booking: z.any().optional(),
    }),
  },
  async ({ confirmationCode }) => {
    try {
      const booking = await getBookingByConfirmationCode(confirmationCode);
      return {
        found: !!booking,
        booking: booking ? {
          confirmationCode: booking.confirmationCode,
          partySize: booking.partySize,
          date: booking.date,
          time: booking.time,
          status: booking.status,
          customerName: booking.customerName,
        } : undefined,
      };
    } catch (error) {
      console.error('Error looking up booking:', error);
      return { found: false };
    }
  }
);

export async function lookupBooking(input: LookupBookingInput): Promise<LookupBookingOutput> {
  return lookupBookingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lookupBookingPrompt',
  tools: [lookupBookingTool],
  input: { schema: LookupBookingInputSchema },
  output: { schema: LookupBookingOutputSchema },
  prompt: `You are an expert AI assistant for a restaurant, specializing in helping customers find and manage their bookings.

Your goal is to extract booking lookup information from the user's message and determine their intent.

**CRITICAL RULES:**
1. Look for confirmation codes - they are typically 8 characters, alphanumeric (e.g., ABC12345, XYZ98765)
2. If you find a confirmation code, use the 'lookupBookingByConfirmationCode' tool to verify it exists
3. Extract any contact information (email, phone, name) that might help identify the booking
4. Determine the user's intent:
   - "lookup" - They just want to see their booking details
   - "modify" - They want to change the booking (date, time, party size, etc.)
   - "cancel" - They want to cancel their reservation
5. Common phrases:
   - "my reservation" / "my booking" = lookup
   - "change" / "modify" / "update" / "move" = modify
   - "cancel" / "delete" / "remove" = cancel

**User Input:**
"{{userInput}}"

**Examples:**
- User: "I need to find my reservation, code is ABC12345"
  → { "confirmationCode": "ABC12345", "intent": "lookup" }

- User: "I want to change my booking ABC12345 to a different time"
  → { "confirmationCode": "ABC12345", "intent": "modify" }

- User: "Cancel my reservation XYZ98765"
  → { "confirmationCode": "XYZ98765", "intent": "cancel" }

- User: "I booked under John Smith, email john@example.com, need to modify"
  → { "name": "John Smith", "email": "john@example.com", "intent": "modify" }

Now extract the booking information and determine the intent:

Output:
`,
});

const lookupBookingFlow = ai.defineFlow(
  {
    name: 'lookupBookingFlow',
    inputSchema: LookupBookingInputSchema,
    outputSchema: LookupBookingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
