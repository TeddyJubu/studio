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
    const lastBookingContext = (lastAssistantMessage?.context?.type === 'booking_suggestion' || lastAssistantMessage?.context?.type === 'booking_confirmed') ? lastAssistantMessage.context.details : {};
    
    // 1. Handle direct confirmation/denial of a booking
    if (lastAssistantMessage?.context?.type === 'booking_suggestion' && lastBookingContext.partySize && lastBookingContext.date && lastBookingContext.time) {
        const lowerCaseContent = userMessage.content.toLowerCase();
        if (lowerCaseContent.startsWith('yes') || lowerCaseContent === 'confirm') {
            const bookingResult = await bookAppointment(lastBookingContext);
            if (bookingResult.success) {
                return {
                    role: 'assistant',
                    content: `Great! Your booking is confirmed. We look forward to seeing you.`,
                    context: { type: 'booking_confirmed', details: lastBookingContext }
                }
            } else {
                 return {
                    role: 'assistant',
                    content: `I'm sorry, I was unable to complete your booking for ${lastBookingContext.partySize} people. Please try again.`
                }
            }
        }
        if (lowerCaseContent.startsWith('no') || lowerCaseContent === 'cancel') {
             return {
                role: 'assistant',
                content: "My apologies. Let's start over. How can I help you with your booking?"
             }
        }
    }

    // 2. Main booking flow
    try {
        const parsedDetails = await parseBookingDetails({ userInput: userMessage.content });
        
        // Merge details from this turn with the ongoing booking context
        const bookingDetails: BookingDetails = {
            ...lastBookingContext,
            ...parsedDetails
        };
        
        // --- Step-by-step booking logic ---

        // Ask for party size if unknown
        if (!bookingDetails.partySize) {
            const isGreeting = /^(hi|hello|hey|yo)\b/i.test(userMessage.content);
            if (isGreeting) {
                return {
                    role: 'assistant',
                    content: "Hello! To help you make a reservation, how many people will be in your party?"
                };
            }
            return {
                role: 'assistant',
                content: 'For how many people?',
                context: { type: 'booking_suggestion', details: bookingDetails }
            };
        }
        
        // Ask for date if unknown
        if (!bookingDetails.date) {
            return {
                role: 'assistant',
                content: `Sounds good. What day are you looking for?`,
                context: { type: 'booking_suggestion', details: bookingDetails }
            };
        }

        // Check availability and ask for time if unknown
        if (!bookingDetails.time) {
            if (parsedDetails.availableSlots && parsedDetails.availableSlots.length > 0) {
                 return {
                    role: 'assistant',
                    content: `We have a few openings on that day. Which time would you like?\n\n${parsedDetails.availableSlots.join(', ')}`,
                    context: { type: 'booking_suggestion', details: bookingDetails }
                }
            } else if (parsedDetails.availableSlots) { // This means the tool ran but found 0 slots
                 return {
                    role: 'assistant',
                    content: `I'm sorry, we don't have any openings for ${bookingDetails.partySize} people on that day. Would you like to try a different date?`,
                    context: { type: 'booking_suggestion', details: { partySize: bookingDetails.partySize } } // Reset date
                }
            }
             // If we have date but no time, and the tool didn't run (e.g. user just said a date)
            return {
                role: 'assistant',
                content: `Perfect. And what time would you like to book?`,
                context: { type: 'booking_suggestion', details: bookingDetails }
            };
        }

        // If all details are present, confirm with user
        return {
            role: 'assistant',
            content: `I can help with that. Please review the booking details below and reply with "yes" or "no" to confirm.`,
            context: { type: 'booking_suggestion', details: bookingDetails }
        }

    } catch (e) {
        console.error("Error in main booking flow:", e);
        // Fallthrough to generic response
    }
    
    // 3. Fallback to a summarization response if booking parsing fails
    try {
        const inquirySummary = await summarizeCustomerInquiry({ inquiry: userMessage.content });
        if (inquirySummary.summary) {
            return {
                role: 'assistant',
                content: `Thanks for your message regarding: "${inquirySummary.summary}". As a restaurant booking agent, I can help you make a reservation. How can I help you today?`
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
