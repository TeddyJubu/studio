"use server";

/**
 * @fileOverview AI flow for classifying user intent to route conversations appropriately.
 *
 * - classifyIntent - A function that determines what the user wants to do.
 * - ClassifyIntentInput - The input type for the classifyIntent function.
 * - ClassifyIntentOutput - The return type for the classifyIntent function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ClassifyIntentInputSchema = z.object({
  userInput: z.string().describe("The user's message to classify."),
  conversationHistory: z
    .array(z.string())
    .optional()
    .describe("Recent conversation context (last 3 messages)."),
});
export type ClassifyIntentInput = z.infer<typeof ClassifyIntentInputSchema>;

const ClassifyIntentOutputSchema = z.object({
  primaryIntent: z
    .enum([
      "booking",
      "modification",
      "cancellation",
      "inquiry",
      "complaint",
      "greeting",
      "feedback",
      "menu",
      "hours",
      "location",
      "waitlist",
      "other",
    ])
    .describe("The primary intent of the user's message."),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score from 0 to 1."),
  subIntent: z
    .string()
    .optional()
    .describe("More specific intent within the primary category."),
  urgency: z
    .enum(["low", "medium", "high", "critical"])
    .describe("The urgency level of the request."),
  sentiment: z
    .enum(["positive", "neutral", "negative", "very_negative"])
    .describe("The emotional tone of the message."),
  suggestedAction: z
    .string()
    .describe("Recommended next action based on the intent."),
  requiresHumanEscalation: z
    .boolean()
    .describe("Whether this should be escalated to a human agent."),
});
export type ClassifyIntentOutput = z.infer<typeof ClassifyIntentOutputSchema>;

export async function classifyIntent(
  input: ClassifyIntentInput
): Promise<ClassifyIntentOutput> {
  return classifyIntentFlow(input);
}

const prompt = ai.definePrompt({
  name: "classifyIntentPrompt",
  input: { schema: ClassifyIntentInputSchema },
  output: { schema: ClassifyIntentOutputSchema },
  prompt: `You are an expert AI assistant specializing in understanding customer intent for a restaurant booking system.

Your job is to analyze the user's message and classify their primary intent, sentiment, and urgency.

**PRIMARY INTENT CATEGORIES:**

1. **booking** - User wants to make a new reservation
   - Examples: "book a table", "I need a reservation", "table for 4"

2. **modification** - User wants to change an existing booking
   - Examples: "change my reservation", "move my booking", "update to 6 people"

3. **cancellation** - User wants to cancel a booking
   - Examples: "cancel my reservation", "I need to cancel", "delete my booking"

4. **inquiry** - User has questions but isn't booking
   - Examples: "do you have vegan options?", "what time do you close?"

5. **complaint** - User is unhappy or reporting an issue
   - Examples: "my booking was cancelled", "terrible service", "I'm upset"

6. **greeting** - Simple greeting or conversation starter
   - Examples: "hi", "hello", "hey there"

7. **feedback** - User providing feedback or review
   - Examples: "great experience", "loved the food", "suggestions for improvement"

8. **menu** - Specific questions about food/drinks
   - Examples: "what's on the menu?", "do you have gluten-free?", "wine list"

9. **hours** - Questions about operating hours
   - Examples: "when are you open?", "what time do you close?", "hours today"

10. **location** - Questions about location, parking, directions
    - Examples: "where are you located?", "parking available?", "directions"

11. **waitlist** - User wants to join waitlist for full slots
    - Examples: "add me to waitlist", "notify me if slot opens", "waiting list"

12. **other** - Doesn't fit other categories

**URGENCY LEVELS:**
- **critical** - Immediate issue (complaint, same-day booking problem)
- **high** - Time-sensitive (booking for tonight, cancellation needed soon)
- **medium** - Important but not urgent (booking this week, general modification)
- **low** - Can wait (general inquiry, future planning)

**SENTIMENT:**
- **positive** - Happy, satisfied, enthusiastic
- **neutral** - Factual, no strong emotion
- **negative** - Disappointed, frustrated
- **very_negative** - Angry, very upset (requires escalation)

**ESCALATION CRITERIA:**
- Very negative sentiment (angry customers)
- Complaints about service or food quality
- Complex requests that AI cannot handle
- Repeated failed attempts to resolve issue
- Explicit request to speak with manager/human

**ANALYSIS RULES:**
1. Consider the conversation context if provided
2. Look for emotion indicators (!!!, CAPS, negative words)
3. Identify time-sensitive language ("tonight", "ASAP", "urgent")
4. Detect complaint signals ("disappointed", "unacceptable", "terrible")
5. Recognize modification vs new booking intent
6. Default to medium urgency if unclear

{{#if conversationHistory}}
**CONVERSATION CONTEXT:**
{{#each conversationHistory}}
- {{this}}
{{/each}}
{{/if}}

**USER MESSAGE:**
"{{userInput}}"

**TASK:**
Analyze the message and provide:
1. Primary intent category
2. Confidence score (0-1)
3. Optional sub-intent (be specific)
4. Urgency level
5. Sentiment
6. Suggested action for the system
7. Whether to escalate to human

**OUTPUT FORMAT:**
Return a structured JSON object with all fields.

**EXAMPLES:**

Example 1:
User: "I need a table for 4 tomorrow at 7pm"
Output: {
  "primaryIntent": "booking",
  "confidence": 0.95,
  "subIntent": "new_reservation",
  "urgency": "medium",
  "sentiment": "neutral",
  "suggestedAction": "Start booking flow, collect remaining details",
  "requiresHumanEscalation": false
}

Example 2:
User: "THIS IS UNACCEPTABLE! My booking was cancelled without notice!"
Output: {
  "primaryIntent": "complaint",
  "confidence": 0.98,
  "subIntent": "cancellation_complaint",
  "urgency": "critical",
  "sentiment": "very_negative",
  "suggestedAction": "Immediately escalate to manager, apologize profusely",
  "requiresHumanEscalation": true
}

Example 3:
User: "Do you have vegetarian options?"
Output: {
  "primaryIntent": "menu",
  "confidence": 0.90,
  "subIntent": "dietary_inquiry",
  "urgency": "low",
  "sentiment": "neutral",
  "suggestedAction": "Provide menu information about vegetarian dishes",
  "requiresHumanEscalation": false
}

Example 4:
User: "Can I change my reservation ABC12345 to 8pm instead?"
Output: {
  "primaryIntent": "modification",
  "confidence": 0.95,
  "subIntent": "time_change",
  "urgency": "medium",
  "sentiment": "neutral",
  "suggestedAction": "Look up booking, check 8pm availability, process modification",
  "requiresHumanEscalation": false
}

Example 5:
User: "hi"
Output: {
  "primaryIntent": "greeting",
  "confidence": 1.0,
  "subIntent": "simple_greeting",
  "urgency": "low",
  "sentiment": "neutral",
  "suggestedAction": "Respond with greeting and ask how you can help",
  "requiresHumanEscalation": false
}

Now analyze the user's message above and return the classification.

Output:
`,
});

const classifyIntentFlow = ai.defineFlow(
  {
    name: "classifyIntentFlow",
    inputSchema: ClassifyIntentInputSchema,
    outputSchema: ClassifyIntentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
