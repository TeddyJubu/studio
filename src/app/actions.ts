"use server";

import { parseBookingDetails } from "@/ai/flows/parse-booking-details";
import { summarizeCustomerInquiry } from "@/ai/flows/summarize-customer-inquiry";
import { generateAvatar as generateAvatarFlow } from "@/ai/flows/generate-avatar";
import { lookupBooking } from "@/ai/flows/lookup-booking";
import type { Message, BookingDetails } from "@/lib/types";
import {
  createBooking,
  updateBooking,
  cancelBooking,
  getBookingByConfirmationCode,
  confirmBooking as confirmBookingInDb,
  type Booking,
} from "@/services/booking-service";
import { getOrCreateCustomer } from "@/services/customer-service";
import {
  validateBookingDetails,
  validateCompleteBooking,
  canModifyBooking,
  canCancelBooking,
  getErrorMessage,
} from "@/lib/validations/booking-validation";

// Create a booking with validation and database integration
export async function bookAppointment(
  details: BookingDetails,
  customerInfo?: { name?: string; email?: string; phone?: string },
): Promise<{
  success: boolean;
  bookingId?: string;
  confirmationCode?: string;
  error?: string;
}> {
  try {
    // Validate booking details
    const validation = validateCompleteBooking(details);
    if (!validation.isValid) {
      return {
        success: false,
        error: getErrorMessage(validation),
      };
    }

    // Get or create customer profile
    let customer = null;
    if (customerInfo?.email || customerInfo?.phone) {
      customer = await getOrCreateCustomer(
        customerInfo.email,
        customerInfo.phone,
        customerInfo.name,
      );
    }

    // Create booking in database
    const booking = await createBooking(details, {
      customerId: customer?.id,
      name: customerInfo?.name || customer?.name,
      email: customerInfo?.email || customer?.email,
      phone: customerInfo?.phone || customer?.phone,
    });

    // Confirm the booking
    await confirmBookingInDb(booking.id);

    return {
      success: true,
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
    };
  } catch (error) {
    console.error("Error booking appointment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create booking",
    };
  }
}

// Modify an existing booking
export async function modifyBooking(
  confirmationCode: string,
  updates: { date?: string; time?: string; partySize?: number },
): Promise<{ success: boolean; error?: string }> {
  try {
    const booking = await getBookingByConfirmationCode(confirmationCode);

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // Check if booking can be modified
    const canModify = canModifyBooking(
      booking.date || "",
      booking.time || "",
      booking.status,
    );

    if (!canModify.canModify) {
      return { success: false, error: canModify.reason };
    }

    // Validate the updates
    const updatedDetails = { ...booking, ...updates };
    const validation = validateBookingDetails(updatedDetails);

    if (!validation.isValid) {
      return { success: false, error: getErrorMessage(validation) };
    }

    // Update in database
    await updateBooking(booking.id, updates);

    return { success: true };
  } catch (error) {
    console.error("Error modifying booking:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to modify booking",
    };
  }
}

// Cancel a booking
export async function cancelBookingByCode(
  confirmationCode: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const booking = await getBookingByConfirmationCode(confirmationCode);

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // Check if booking can be cancelled
    const canCancel = canCancelBooking(
      booking.date || "",
      booking.time || "",
      booking.status,
    );

    if (!canCancel.canCancel) {
      return { success: false, error: canCancel.reason };
    }

    // Cancel in database
    await cancelBooking(booking.id, reason);

    return { success: true };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to cancel booking",
    };
  }
}

// Lookup a booking
export async function lookupBookingByCode(
  confirmationCode: string,
): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  try {
    const booking = await getBookingByConfirmationCode(confirmationCode);

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    return { success: true, booking };
  } catch (error) {
    console.error("Error looking up booking:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to lookup booking",
    };
  }
}

export async function getAIResponse(
  messages: Message[],
): Promise<Omit<Message, "id" | "component">> {
  const userMessage = messages[messages.length - 1];

  // Validate input
  if (!userMessage.content || userMessage.content.trim().length === 0) {
    return {
      role: "assistant",
      content: "Please type a message to continue.",
    };
  }

  if (userMessage.content.length > 500) {
    return {
      role: "assistant",
      content: "Your message is too long. Please keep it under 500 characters.",
    };
  }

  // Check if the user is confirming a previous booking suggestion
  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((m) => m.role === "assistant");
  const lastBookingContext =
    lastAssistantMessage?.context?.type === "booking_suggestion" ||
    lastAssistantMessage?.context?.type === "booking_confirmed"
      ? lastAssistantMessage.context.details
      : {};

  // 1. Check if user wants to lookup/modify/cancel a booking
  const lowerContent = userMessage.content.toLowerCase();
  if (
    lowerContent.includes("reservation") ||
    lowerContent.includes("booking") ||
    lowerContent.includes("confirmation")
  ) {
    if (
      lowerContent.includes("find") ||
      lowerContent.includes("lookup") ||
      lowerContent.includes("modify") ||
      lowerContent.includes("change") ||
      lowerContent.includes("cancel")
    ) {
      try {
        const lookupResult = await lookupBooking({
          userInput: userMessage.content,
        });

        if (lookupResult.confirmationCode) {
          const bookingLookup = await lookupBookingByCode(
            lookupResult.confirmationCode,
          );

          if (bookingLookup.success && bookingLookup.booking) {
            return {
              role: "assistant",
              content: `I found your booking!`,
              context: {
                type: "booking_found",
                booking: bookingLookup.booking,
                intent: lookupResult.intent,
              },
            };
          } else {
            return {
              role: "assistant",
              content: `I couldn't find a booking with code ${lookupResult.confirmationCode}. Please check the code and try again.`,
            };
          }
        } else {
          return {
            role: "assistant",
            content:
              "To look up your booking, please provide your confirmation code (e.g., ABC12345).",
          };
        }
      } catch (error) {
        console.error("Error in booking lookup:", error);
      }
    }
  }

  // 2. Handle direct confirmation/denial of a booking
  if (
    lastAssistantMessage?.context?.type === "booking_suggestion" &&
    lastBookingContext.partySize &&
    lastBookingContext.date &&
    lastBookingContext.time
  ) {
    const lowerCaseContent = userMessage.content.toLowerCase();
    if (lowerCaseContent.startsWith("yes") || lowerCaseContent === "confirm") {
      // Validate before booking
      const validation = validateCompleteBooking(lastBookingContext);
      if (!validation.isValid) {
        return {
          role: "assistant",
          content: `I found some issues with the booking: ${getErrorMessage(validation)}`,
        };
      }

      const bookingResult = await bookAppointment(lastBookingContext);
      if (bookingResult.success) {
        return {
          role: "assistant",
          content: `Great! Your booking is confirmed. Your confirmation code is: ${bookingResult.confirmationCode}. We look forward to seeing you!`,
          context: {
            type: "booking_confirmed",
            details: lastBookingContext,
            confirmationCode: bookingResult.confirmationCode,
          },
        };
      } else {
        return {
          role: "assistant",
          content: `I'm sorry, I was unable to complete your booking: ${bookingResult.error || "Please try again."}`,
        };
      }
    }
    if (lowerCaseContent.startsWith("no") || lowerCaseContent === "cancel") {
      return {
        role: "assistant",
        content:
          "My apologies. Let's start over. How can I help you with your booking?",
      };
    }
  }

  // 3. Main booking flow
  try {
    const parsedDetails = await parseBookingDetails({
      userInput: userMessage.content,
    });

    // Merge details from this turn with the ongoing booking context
    const bookingDetails: BookingDetails = {
      ...lastBookingContext,
      ...parsedDetails,
    };

    // Validate the current booking state
    const validation = validateBookingDetails(bookingDetails);

    // If there are critical errors, return them
    if (validation.errors.length > 0) {
      const criticalErrors = validation.errors.filter(
        (e) => e.severity === "critical",
      );
      if (criticalErrors.length > 0) {
        return {
          role: "assistant",
          content: criticalErrors[0].message,
          context: { type: "booking_suggestion", details: bookingDetails },
        };
      }
    }

    // --- Step-by-step booking logic ---

    // Ask for party size if unknown
    if (!bookingDetails.partySize) {
      const isGreeting = /^(hi|hello|hey|yo)\b/i.test(userMessage.content);
      if (isGreeting) {
        return {
          role: "assistant",
          content:
            "Hello! To help you make a reservation, how many people will be in your party?",
        };
      }
      return {
        role: "assistant",
        content: "For how many people?",
        context: { type: "booking_suggestion", details: bookingDetails },
      };
    }

    // Ask for date if unknown
    if (!bookingDetails.date) {
      return {
        role: "assistant",
        content: `Sounds good. What day are you looking for?`,
        context: { type: "booking_suggestion", details: bookingDetails },
      };
    }

    // Check availability and ask for time if unknown
    if (!bookingDetails.time) {
      if (
        parsedDetails.availableSlots &&
        parsedDetails.availableSlots.length > 0
      ) {
        return {
          role: "assistant",
          content: `We have a few openings on that day. Which time would you like?\n\n${parsedDetails.availableSlots.join(", ")}`,
          context: { type: "booking_suggestion", details: bookingDetails },
        };
      } else if (parsedDetails.availableSlots) {
        // This means the tool ran but found 0 slots
        return {
          role: "assistant",
          content: `I'm sorry, we don't have any openings for ${bookingDetails.partySize} people on that day. Would you like to try a different date?`,
          context: {
            type: "booking_suggestion",
            details: { partySize: bookingDetails.partySize },
          }, // Reset date
        };
      }
      // If we have date but no time, and the tool didn't run (e.g. user just said a date)
      return {
        role: "assistant",
        content: `Perfect. And what time would you like to book?`,
        context: { type: "booking_suggestion", details: bookingDetails },
      };
    }

    // If all details are present, validate and confirm with user
    const finalValidation = validateCompleteBooking(bookingDetails);

    if (!finalValidation.isValid) {
      const errorMsg = getErrorMessage(finalValidation);
      return {
        role: "assistant",
        content: `Before we proceed, there's an issue: ${errorMsg}`,
        context: { type: "booking_suggestion", details: bookingDetails },
      };
    }

    let confirmMessage = `I can help with that. Please review the booking details below and reply with "yes" or "no" to confirm.`;

    // Add warnings/suggestions if any
    if (finalValidation.warnings.length > 0) {
      confirmMessage += `\n\nNote: ${finalValidation.warnings[0].message}`;
    }

    return {
      role: "assistant",
      content: confirmMessage,
      context: { type: "booking_suggestion", details: bookingDetails },
    };
  } catch (e) {
    console.error("Error in main booking flow:", e);
    return {
      role: "assistant",
      content:
        "I'm having trouble processing that. Could you try rephrasing your request?",
    };
  }

  // 4. Fallback to a summarization response if booking parsing fails
  try {
    const inquirySummary = await summarizeCustomerInquiry({
      inquiry: userMessage.content,
    });
    if (inquirySummary.summary) {
      return {
        role: "assistant",
        content: `Thanks for your message regarding: "${inquirySummary.summary}". As a restaurant booking agent, I can help you make a reservation. How can I help you today?`,
      };
    }
  } catch (e) {
    console.error("Error summarizing inquiry:", e);
  }

  return {
    role: "assistant",
    content: `I'm sorry, I didn't quite understand. As a restaurant booking assistant, I can help you make a reservation.`,
  };
}

export async function generateAvatar(
  prompt: string,
): Promise<{ avatarUrl: string }> {
  try {
    const result = await generateAvatarFlow({ prompt });
    return result;
  } catch (error) {
    console.error("Error generating avatar:", error);
    throw new Error("Failed to generate avatar.");
  }
}
