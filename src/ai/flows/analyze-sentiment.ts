/**
 * Sentiment Analysis Flow
 *
 * Analyzes customer message sentiment and determines escalation needs.
 * Provides sentiment score, emotion detection, and urgency assessment.
 */

import { ai } from "../genkit";
import { z } from "zod";

const SentimentAnalysisOutput = z.object({
  sentiment: z.enum(["positive", "neutral", "negative", "very_negative"]),
  sentimentScore: z
    .number()
    .min(-1)
    .max(1)
    .describe("Score from -1 (very negative) to 1 (very positive)"),
  emotions: z
    .array(
      z.enum([
        "happy",
        "satisfied",
        "neutral",
        "frustrated",
        "angry",
        "confused",
        "disappointed",
        "excited",
        "anxious",
        "grateful",
      ]),
    )
    .describe("Detected emotions in the message"),
  urgency: z
    .enum(["low", "medium", "high", "critical"])
    .describe("How urgently this needs attention"),
  needsEscalation: z
    .boolean()
    .describe("Whether this should be escalated to a human"),
  escalationReason: z.string().optional().describe("Why escalation is needed"),
  keyPhrases: z
    .array(z.string())
    .describe("Key phrases that influenced sentiment analysis"),
  tone: z.enum([
    "formal",
    "casual",
    "professional",
    "aggressive",
    "friendly",
    "sarcastic",
  ]),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence in sentiment analysis"),
});

export type SentimentAnalysis = z.infer<typeof SentimentAnalysisOutput>;

export const analyzeSentiment = ai.defineFlow(
  {
    name: "analyzeSentiment",
    inputSchema: z.object({
      message: z.string().describe("The customer message to analyze"),
      conversationContext: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        )
        .optional()
        .describe("Previous messages for context"),
    }),
    outputSchema: SentimentAnalysisOutput,
  },
  async ({
    message,
    conversationContext,
  }: {
    message: string;
    conversationContext?: Array<{ role: string; content: string }>;
  }) => {
    const contextString = conversationContext
      ? conversationContext
          .map(
            (m: { role: string; content: string }) => `${m.role}: ${m.content}`,
          )
          .join("\n")
      : "";

    const prompt = `You are an expert sentiment analyst for a restaurant booking chatbot.

Analyze the following customer message for sentiment, emotions, and urgency.

${contextString ? `Previous conversation:\n${contextString}\n\n` : ""}Current message: "${message}"

Consider:
1. Overall sentiment (positive, neutral, negative, very_negative)
2. Sentiment score (-1 to 1, where -1 is very negative and 1 is very positive)
3. Specific emotions expressed
4. Urgency level (how quickly this needs attention)
5. Whether human escalation is needed
6. Tone of the message
7. Key phrases that indicate sentiment

Escalate if:
- Customer is very frustrated or angry
- Issue is urgent (tonight's reservation, payment problems, etc.)
- Customer explicitly requests to speak to a manager
- Multiple failed attempts to resolve issue
- Complaint about food safety, discrimination, or serious issues
- Legal language or threats

Provide your analysis in JSON format.`;

    const response = await ai.generate({
      model: "gemini-2.0-flash-exp",
      prompt,
      output: {
        schema: SentimentAnalysisOutput,
      },
    });

    return response.output!;
  },
);
