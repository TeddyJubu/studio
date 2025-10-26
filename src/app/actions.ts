"use server";

import { parseBookingDetails } from "@/ai/flows/parse-booking-details";
import { summarizeCustomerInquiry } from "@/ai/flows/summarize-customer-inquiry";
import { generateAvatar as generateAvatarFlow } from "@/ai/flows/generate-avatar";
import type { Message, BookingDetails } from "@/lib/types";

// In a real app, this would integrate with a booking service or database
export async function bookAppointment(details: BookingDetails): Promise<{ success: boolean }> {
  console.log("Booking appointment:", details);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  // In a real app, you'd handle potential booking failures
  return { success: true };
}

export async function getAIResponse(messages: Message[]): Promise<Omit<Message, 'id' | 'component'>> {
    const userMessage = messages[messages.length - 1];
    
    // Check if the user is confirming a previous booking suggestion
    const lastAssistantMessage = messages.slice().reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage?.context?.type === 'booking_suggestion' && (userMessage.content.toLowerCase().startsWith('yes') || userMessage.content.toLowerCase() === 'confirm')) {
        const bookingDetails = lastAssistantMessage.context.details;
        const bookingResult = await bookAppointment(bookingDetails);
        
        if (bookingResult.success) {
            return {
                role: 'assistant',
                content: `Great! Your booking is confirmed. We look forward to seeing you.`,
                context: { type: 'booking_confirmed', details: bookingDetails }
            }
        } else {
             return {
                role: 'assistant',
                content: `I'm sorry, I was unable to complete your booking for ${bookingDetails.partySize} people. Please try again.`
            }
        }
    } else if (lastAssistantMessage?.context?.type === 'booking_suggestion' && (userMessage.content.toLowerCase().startsWith('no') || userMessage.content.toLowerCase() === 'cancel')) {
        return {
            role: 'assistant',
            content: "My apologies. Let's try again. What would you like to change?"
        }
    }
    
    // Try to parse for a booking
    try {
        const parsed = await parseBookingDetails({ userInput: userMessage.content });
        // Only trigger suggestion if we have at least one valid detail
        if (Object.values(parsed).some(detail => detail !== undefined && detail !== null)) {
             // If we only have partial info, ask for more.
            if (!parsed.partySize) {
                 return {
                    role: 'assistant',
                    content: `I can help with that. How many people will be in your party?`,
                    context: { type: 'booking_suggestion', details: parsed }
                }
            }
             if (!parsed.date && !parsed.time) {
                 return {
                    role: 'assistant',
                    content: `Sounds good. What day and time are you looking for?`,
                    context: { type: 'booking_suggestion', details: parsed }
                }
            }

            return {
                role: 'assistant',
                content: `I can help with that. Please review the booking details below and reply with "yes" or "no" to confirm.`,
                context: { type: 'booking_suggestion', details: parsed }
            }
        }
    } catch (e) {
        console.error("Error parsing booking details:", e);
        // Fallthrough to generic response
    }
    
    // Fallback to a generic summarization response if booking fails
    try {
        const inquirySummary = await summarizeCustomerInquiry({ inquiry: userMessage.content });
        if (inquirySummary.summary) {
            return {
                role: 'assistant',
                content: `Thanks for your message regarding: "${inquirySummary.summary}". As a restaurant booking agent, I can help you make a reservation. How many people are in your party and for what date and time?`
            }
        }
    } catch (e) {
        console.error("Error summarizing inquiry:", e);
    }

    return {
        role: 'assistant',
        content: `I'm sorry, I didn't quite understand. As a restaurant booking assistant, I can help you make a reservation.`
    }
}

export async function generateAvatar(prompt: string): Promise<{ avatarUrl: string }> {
  try {
    const result = await generateAvatarFlow({ prompt });
    return result;
  } catch (error) {
    console.error('Error generating avatar:', error);
    throw new Error('Failed to generate avatar.');
  }
}
