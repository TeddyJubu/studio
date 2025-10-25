'use server';

/**
 * @fileOverview This file defines a Genkit flow for getting available appointment slots.
 *
 * - getAvailableSlots - A function that returns a list of available appointment slots.
 * - GetAvailableSlotsInput - The input type for the getAvailableSlots function.
 * - GetAvailableSlotsOutput - The return type for the getAvailableSlots function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { addDays, format } from 'date-fns';

const GetAvailableSlotsInputSchema = z.object({});
export type GetAvailableSlotsInput = z.infer<typeof GetAvailableSlotsInputSchema>;

const GetAvailableSlotsOutputSchema = z.object({
  slots: z.array(z.string()).describe('A list of available appointment slots in YYYY-MM-DD format.'),
});
export type GetAvailableSlotsOutput = z.infer<typeof GetAvailableSlotsOutputSchema>;

export async function getAvailableSlots(input: GetAvailableSlotsInput): Promise<GetAvailableSlotsOutput> {
  return getAvailableSlotsFlow(input);
}

const getAvailableSlotsFlow = ai.defineFlow(
  {
    name: 'getAvailableSlotsFlow',
    inputSchema: GetAvailableSlotsInputSchema,
    outputSchema: GetAvailableSlotsOutputSchema,
  },
  async () => {
    // In a real app, you would fetch this from a database or a booking service.
    // For this example, we'll generate some random available slots for the next 30 days.
    const today = new Date();
    const slots: string[] = [];
    for (let i = 0; i < 30; i++) {
      if (Math.random() > 0.5) { // 50% chance of a day being available
        const date = addDays(today, i);
        slots.push(format(date, 'yyyy-MM-dd'));
      }
    }
    return { slots };
  }
);
