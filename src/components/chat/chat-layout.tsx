"use client";

import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import {
  getAIResponse,
  modifyBooking,
  cancelBookingByCode,
} from "@/app/actions";
import type { Message } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { BookingDisplay } from "./booking-display";
import { ModificationFlow } from "@/components/booking/modification-flow";
import { useChatStore } from "@/store/chat-store";
import { useCustomerStore } from "@/store/customer-store";

export function ChatLayout() {
  // Use Zustand stores
  const {
    messages,
    isLoading,
    currentBooking,
    addMessage,
    updateMessages,
    setIsLoading,
    updateBooking,
  } = useChatStore();

  const { customer } = useCustomerStore();
  const { toast } = useToast();

  const handleSendMessage = async (content: string) => {
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    // Add user message to store
    addMessage(userMessage);
    setIsLoading(true);

    try {
      const newMessages = [...messages, userMessage];
      const assistantResponse = await getAIResponse(newMessages);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        ...assistantResponse,
      };

      // Handle booking suggestion display
      if (assistantMessage.context?.type === "booking_suggestion") {
        assistantMessage.component = (
          <BookingDisplay details={assistantMessage.context.details} />
        );
        // Update current booking in store
        updateBooking(assistantMessage.context.details);
      }

      // Handle booking confirmation display
      if (assistantMessage.context?.type === "booking_confirmed") {
        assistantMessage.component = (
          <BookingDisplay
            details={assistantMessage.context.details}
            confirmed={true}
          />
        );
      }

      // Handle booking found (modification/cancellation flow)
      if (assistantMessage.context?.type === "booking_found") {
        const booking = assistantMessage.context.booking;

        assistantMessage.component = (
          <ModificationFlow
            booking={booking}
            onModify={async (updates) => {
              const result = await modifyBooking(
                booking.confirmationCode,
                updates,
              );
              if (result.success) {
                toast({
                  title: "Success",
                  description: "Booking updated successfully!",
                });
                // Send confirmation message
                const confirmMsg: Message = {
                  id: Date.now().toString(),
                  role: "assistant",
                  content:
                    "Your booking has been updated successfully. Is there anything else I can help you with?",
                };
                addMessage(confirmMsg);
              } else {
                toast({
                  title: "Error",
                  description: result.error || "Failed to update booking",
                  variant: "destructive",
                });
              }
            }}
            onCancel={async (reason) => {
              const result = await cancelBookingByCode(
                booking.confirmationCode,
                reason,
              );
              if (result.success) {
                toast({
                  title: "Cancelled",
                  description: "Your booking has been cancelled.",
                });
                // Send confirmation message
                const confirmMsg: Message = {
                  id: Date.now().toString(),
                  role: "assistant",
                  content:
                    "Your booking has been cancelled. We hope to see you another time!",
                };
                addMessage(confirmMsg);
              } else {
                toast({
                  title: "Error",
                  description: result.error || "Failed to cancel booking",
                  variant: "destructive",
                });
              }
            }}
            onClose={() => {
              const closeMsg: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: "How else can I assist you today?",
              };
              addMessage(closeMsg);
            }}
          />
        );
      }

      // Handle error context
      if (assistantMessage.context?.type === "error") {
        toast({
          title: "Error",
          description: assistantMessage.content,
          variant: "destructive",
        });
      }

      // Add assistant message to store
      addMessage(assistantMessage);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response from the AI. Please try again.",
        variant: "destructive",
      });

      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "I'm having trouble processing your request. Please try again or call us at (555) 123-4567.",
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <ChatMessages messages={messages} isLoading={isLoading} />
      <div className="mt-auto border-t p-4">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
