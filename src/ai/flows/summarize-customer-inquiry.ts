'use server';

/**
 * @fileOverview Summarizes a customer inquiry using AI.
 *
 * - summarizeCustomerInquiry - A function that summarizes the customer inquiry.
 * - SummarizeCustomerInquiryInput - The input type for the summarizeCustomerInquiry function.
 * - SummarizeCustomerInquiryOutput - The return type for the summarizeCustomerInquiry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCustomerInquiryInputSchema = z.object({
  inquiry: z.string().describe('The customer inquiry to summarize.'),
});
export type SummarizeCustomerInquiryInput = z.infer<typeof SummarizeCustomerInquiryInputSchema>;

const SummarizeCustomerInquiryOutputSchema = z.object({
  summary: z.string().describe('A short summary of the customer inquiry.'),
});
export type SummarizeCustomerInquiryOutput = z.infer<typeof SummarizeCustomerInquiryOutputSchema>;

export async function summarizeCustomerInquiry(
  input: SummarizeCustomerInquiryInput
): Promise<SummarizeCustomerInquiryOutput> {
  return summarizeCustomerInquiryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCustomerInquiryPrompt',
  input: {schema: SummarizeCustomerInquiryInputSchema},
  output: {schema: SummarizeCustomerInquiryOutputSchema},
  prompt: `You are a customer support agent. Summarize the following customer inquiry in a concise manner:\n\n{{inquiry}}`,
});

const summarizeCustomerInquiryFlow = ai.defineFlow(
  {
    name: 'summarizeCustomerInquiryFlow',
    inputSchema: SummarizeCustomerInquiryInputSchema,
    outputSchema: SummarizeCustomerInquiryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
