"use server";

import { parseAppointmentPreferences } from "@/ai/flows/intelligent-appointment-parsing";
import { summarizeCustomerInquiry } from "@/ai/flows/summarize-customer-inquiry";
import { getAvailableSlots } from "@/ai/flows/get-available-slots";
import { generateAvatar as generateAvatarFlow } from "@/ai/flows/generate-avatar";
import type { Message, AppointmentDetails } from "@/lib/types";

// In a real app, this would integrate with a booking service like Cal.com
export async function bookAppointment(details: AppointmentDetails): Promise<{ success: boolean }> {
  console.log("Booking appointment:", details);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  // In a real app, you'd handle potential booking failures
  return { success: true };
}

export async function getAIResponse(messages: Message[]): Promise<Omit<Message, 'id' | 'component'>> {
    const userMessage = messages[messages.length - 1];
    
    // Check if the user is confirming a previous appointment suggestion
    const lastAssistantMessage = messages.slice().reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage?.context?.type === 'appointment_suggestion' && (userMessage.content.toLowerCase().startsWith('yes') || userMessage.content.toLowerCase() === 'confirm')) {
        const appointmentDetails = lastAssistantMessage.context.details;
        const bookingResult = await bookAppointment(appointmentDetails);
        
        if (bookingResult.success) {
            return {
                role: 'assistant',
                content: `Great! Your appointment for "${appointmentDetails.purpose}" is confirmed.`,
                context: { type: 'appointment_confirmed', details: appointmentDetails }
            }
        } else {
             return {
                role: 'assistant',
                content: `I'm sorry, I was unable to book the appointment for "${appointmentDetails.purpose}". Please try again.`
            }
        }
    } else if (lastAssistantMessage?.context?.type === 'appointment_suggestion' && (userMessage.content.toLowerCase().startsWith('no') || userMessage.content.toLowerCase() === 'cancel')) {
        return {
            role: 'assistant',
            content: "My apologies. Let's try again. Please provide the correct details for your appointment."
        }
    }
    
    // Check if user is asking for available slots
    if (userMessage.content.toLowerCase().includes('available slot')) {
      try {
        const { slots } = await getAvailableSlots({});
        return {
          role: 'assistant',
          content: 'Here are the available slots. Please select a date.',
          context: { type: 'calendar', slots },
        };
      } catch (e) {
        console.error('Error getting available slots:', e);
        // Fallthrough to generic response
      }
    }

    // Try to parse for an appointment
    try {
        const parsed = await parseAppointmentPreferences({ userInput: userMessage.content });
        if (parsed.date || parsed.time || parsed.purpose) {
            return {
                role: 'assistant',
                content: `I can help with that. Please review the details below and reply with "yes" or "no" to confirm.`,
                context: { type: 'appointment_suggestion', details: parsed }
            }
        }
    } catch (e) {
        console.error("Error parsing appointment:", e);
        // Fallthrough to generic response
    }
    
    // Fallback to a generic response
    try {
        const inquirySummary = await summarizeCustomerInquiry({ inquiry: userMessage.content });
        if (inquirySummary.summary) {
            return {
                role: 'assistant',
                content: `Thanks for your message regarding: "${inquirySummary.summary}". How can I help you today?`
            }
        }
    } catch (e) {
        console.error("Error summarizing inquiry:", e);
    }

    return {
        role: 'assistant',
        content: `I'm sorry, I didn't quite understand. As a customer support assistant, I can help with your inquiries or book an appointment.`
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
