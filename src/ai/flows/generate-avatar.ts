'use server';

/**
 * @fileOverview A Genkit flow for generating a chatbot avatar.
 *
 * - generateAvatar - A function that generates an avatar based on a prompt.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAvatarInputSchema = z.object({
  prompt: z.string().describe('A prompt to generate an avatar image.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  avatarUrl: z.string().describe('The data URI of the generated avatar.'),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async ({ prompt }) => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Generate a modern, friendly, and professional chatbot avatar. The avatar should be a simple, abstract, or geometric design. It should be visually appealing and suitable for a customer support context. The design should be clean, minimalist, and use a pleasant color palette. The output should be a square image with a transparent background.

Prompt: "${prompt}"`,
      config: {
        aspectRatio: '1:1',
      },
    });

    if (!media.url) {
      throw new Error('Image generation failed.');
    }

    return { avatarUrl: media.url };
  }
);
