'use server';

/**
 * @fileOverview This file defines a Genkit flow for intelligently parsing booking details from user input.
 *
 * - parseBookingDetails - A function that takes user input and returns structured booking information.
 * - ParseBookingDetailsInput - The input type for the parseBookingDetails function.
 * - ParseBookingDetailsOutput - The return type for the parseBookingDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseBookingDetailsInputSchema = z.object({
  userInput: z.string().describe('The user input containing booking preferences for a restaurant or service.'),
});
export type ParseBookingDetailsInput = z.infer<typeof ParseBookingDetailsInputSchema>;

const ParseBookingDetailsOutputSchema = z.object({
  partySize: z.number().optional().describe('The number of people in the party.'),
  date: z.string().optional().describe('The desired date of the booking (YYYY-MM-DD).'),
  time: z.string().optional().describe('The desired time of the booking (HH:MM in 24-hour format).'),
  occasion: z.string().optional().describe('Any special occasion for the booking (e.g., "birthday", "anniversary").'),
  specialRequests: z.string().optional().describe('Any special requests from the user (e.g., "window seat", "quiet table").'),
});
export type ParseBookingDetailsOutput = z.infer<typeof ParseBookingDetailsOutputSchema>;

export async function parseBookingDetails(input: ParseBookingDetailsInput): Promise<ParseBookingDetailsOutput> {
  return parseBookingDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseBookingDetailsPrompt',
  input: {schema: ParseBookingDetailsInputSchema},
  output: {schema: ParseBookingDetailsOutputSchema},
  prompt: `You are an expert AI assistant for a restaurant, specializing in parsing booking details from unstructured user input. Your goal is to extract specific pieces of information to create a reservation.

  Today's date is ${new Date().toISOString().split('T')[0]}.

  From the user's message, extract the following details:
  - partySize: The number of people for the reservation.
  - date: The desired date, which you must format as YYYY-MM-DD.
  - time: The desired time, which you must format as HH:MM (24-hour clock).
  - occasion: Any special event mentioned (e.g., "birthday", "anniversary").
  - specialRequests: Any other specific needs (e.g., "window seat", "high chair", "booth").

  **IMPORTANT RULES:**
  1.  If a piece of information is not explicitly mentioned, leave its corresponding field undefined in the JSON output.
  2.  Do NOT invent or assume any details. For example, if the user says "tonight" but doesn't give a time, only fill in the date.
  3.  Pay close attention to relative dates like "tomorrow", "next Friday", "this Sunday".

  User Input:
  "{{userInput}}"

  Here are some examples to guide you:
  - User: "I'd like a table for 2 people tomorrow at 7:30pm." -> AI output: { "partySize": 2, "date": "2024-08-16", "time": "19:30" }
  - User: "Can I book a reservation for a party of 5 next Friday?" -> AI output: { "partySize": 5, "date": "2024-08-23" }
  - User: "We need a spot for 4 this Saturday at noon for a birthday. We need a high chair." -> AI output: { "partySize": 4, "date": "2024-08-17", "time": "12:00", "occasion": "birthday", "specialRequests": "high chair needed" }
  - User: "A table for three please" -> AI output: { "partySize": 3 }
  - User: "is there any available slot tomorrow?" -> AI output: { "date": "2024-08-16" }

  Now, process the new user input based on these rules.

  Output:
  `,
});

const parseBookingDetailsFlow = ai.defineFlow(
  {
    name: 'parseBookingDetailsFlow',
    inputSchema: ParseBookingDetailsInputSchema,
    outputSchema: ParseBookingDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
