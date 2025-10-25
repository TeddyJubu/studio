'use server';

/**
 * @fileOverview This file defines a Genkit flow for intelligently parsing appointment preferences from user input.
 *
 * - parseAppointmentPreferences - A function that takes user input and returns structured appointment details.
 * - ParseAppointmentPreferencesInput - The input type for the parseAppointmentPreferences function.
 * - ParseAppointmentPreferencesOutput - The return type for the parseAppointmentPreferences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseAppointmentPreferencesInputSchema = z.object({
  userInput: z.string().describe('The user input containing appointment preferences.'),
});
export type ParseAppointmentPreferencesInput = z.infer<typeof ParseAppointmentPreferencesInputSchema>;

const ParseAppointmentPreferencesOutputSchema = z.object({
  date: z.string().describe('The date of the appointment (YYYY-MM-DD).'),
  time: z.string().describe('The time of the appointment (HH:MM).'),
  purpose: z.string().describe('The purpose of the appointment.'),
});
export type ParseAppointmentPreferencesOutput = z.infer<typeof ParseAppointmentPreferencesOutputSchema>;

export async function parseAppointmentPreferences(input: ParseAppointmentPreferencesInput): Promise<ParseAppointmentPreferencesOutput> {
  return parseAppointmentPreferencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseAppointmentPreferencesPrompt',
  input: {schema: ParseAppointmentPreferencesInputSchema},
  output: {schema: ParseAppointmentPreferencesOutputSchema},
  prompt: `You are an AI assistant designed to parse appointment preferences from user input.

  Extract the date, time, and purpose of the appointment from the following user input:
  {{userInput}}

  Ensure that the date is in YYYY-MM-DD format and the time is in HH:MM format.
  Return the extracted information in a structured JSON format.
  If some information is not found, leave it blank in the JSON output. Do not make up the date, time or purpose.

  Example:
  User Input: I want to book an appointment for tomorrow at 2pm for a consultation.
  Output: { \"date\": \"2024-08-16\", \"time\": \"14:00\", \"purpose\": \"consultation\" }

  User Input: I'd like to book a meeting with you next Monday at 10:00 to discuss Project X.
  Output: { \"date\": \"2024-08-19\", \"time\": \"10:00\", \"purpose\": \"discuss Project X\" }

  User Input: I want to schedule an appointment for next Tuesday.
  Output: { \"date\": \"2024-08-20\", \"time\": \"\", \"purpose\": \"\" }

  Output:
  `,
});

const parseAppointmentPreferencesFlow = ai.defineFlow(
  {
    name: 'parseAppointmentPreferencesFlow',
    inputSchema: ParseAppointmentPreferencesInputSchema,
    outputSchema: ParseAppointmentPreferencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
