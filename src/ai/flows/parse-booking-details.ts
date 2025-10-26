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
  prompt: `You are an AI assistant designed to parse booking details for a restaurant or service from unstructured user input.

  Today's date is ${new Date().toISOString().split('T')[0]}.

  Extract the following information from the user input:
  - partySize: The number of people.
  - date: The desired date, formatted as YYYY-MM-DD.
  - time: The desired time, formatted as HH:MM (24-hour clock).
  - occasion: Any special occasion mentioned.
  - specialRequests: Any other specific requests.

  If a piece of information is not present, leave it undefined in the JSON output. Do not make up information.

  User Input:
  "{{userInput}}"

  Examples:
  - "I'd like a table for 2 people tomorrow at 7:30pm." -> { "partySize": 2, "date": "2024-08-16", "time": "19:30" }
  - "Can I book a reservation for a party of 5 next Friday?" -> { "partySize": 5, "date": "2024-08-23" }
  - "We need a spot for 4 this Saturday at noon for a birthday. We need a high chair." -> { "partySize": 4, "date": "2024-08-17", "time": "12:00", "occasion": "birthday", "specialRequests": "high chair needed" }
  - "A table for three please" -> { "partySize": 3 }

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
