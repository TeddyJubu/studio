"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import type { JSONValue, Message as AIMessages } from "@ai-sdk/ui-utils";

import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { modifyBooking, cancelBookingByCode } from "@/app/actions";
import type { BookingDetails, Message } from "@/lib/types";
import type { Booking } from "@/services/booking-service";
import { useToast } from "@/hooks/use-toast";
import { BookingDisplay } from "./booking-display";
import { ModificationFlow } from "@/components/booking/modification-flow";
import { useChatStore } from "@/store/chat-store";

const INITIAL_GREETING =
  "Hello! I'm MastraMind, your booking assistant. How can I help you book your appointment today?";
const CONTEXT_ANNOTATION_KEY = "assistant-context";
const FOLLOW_UP_CONFIRMATION =
  "Your booking has been updated successfully. Is there anything else I can help you with?";
const FOLLOW_UP_CANCELLATION =
  "Your booking has been cancelled. We hope to see you another time!";
const FOLLOW_UP_CLOSE = "How else can I assist you today?";

type ContextAnnotation = {
  type: string;
  context?: JSONValue;
};

function reviveBooking(raw: unknown): Booking {
  const fallback: Booking = {
    id: crypto.randomUUID(),
    confirmationCode: "UNKNOWN",
    status: "pending",
    source: "web",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const booking = raw as Booking & {
    createdAt?: string | Date;
    updatedAt?: string | Date;
    cancelledAt?: string | Date | null;
  };

  return {
    ...fallback,
    ...booking,
    id: typeof booking.id === "string" ? booking.id : fallback.id,
    confirmationCode:
      typeof booking.confirmationCode === "string"
        ? booking.confirmationCode
        : fallback.confirmationCode,
    status: booking.status ?? fallback.status,
    source: booking.source ?? fallback.source,
    createdAt: booking.createdAt
      ? new Date(booking.createdAt)
      : fallback.createdAt,
    updatedAt: booking.updatedAt
      ? new Date(booking.updatedAt)
      : fallback.updatedAt,
    cancelledAt: booking.cancelledAt
      ? new Date(booking.cancelledAt)
      : undefined,
  };
}

function deserializeContext(value?: JSONValue): Message["context"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  switch (record.type) {
    case "booking_suggestion":
      return {
        type: "booking_suggestion",
        details: (record.details as BookingDetails) ?? {},
      };
    case "booking_confirmed":
      return {
        type: "booking_confirmed",
        details: (record.details as BookingDetails) ?? {},
        confirmationCode:
          typeof record.confirmationCode === "string"
            ? record.confirmationCode
            : undefined,
      };
    case "booking_found":
      return {
        type: "booking_found",
        intent:
          record.intent === "modify" ||
          record.intent === "cancel" ||
          record.intent === "lookup"
            ? (record.intent as "lookup" | "modify" | "cancel")
            : "lookup",
        booking: reviveBooking(record.booking),
      };
    case "menu_query":
    case "loyalty_status":
    case "pricing_info":
    case "error":
      return record as Message["context"];
    default:
      return undefined;
  }
}

function extractContextFromAnnotations(
  annotations?: AIMessages["annotations"],
): Message["context"] | undefined {
  if (!Array.isArray(annotations)) {
    return undefined;
  }

  for (const annotation of annotations) {
    if (
      annotation &&
      typeof annotation === "object" &&
      "type" in annotation &&
      (annotation as ContextAnnotation).type === CONTEXT_ANNOTATION_KEY
    ) {
      return deserializeContext((annotation as ContextAnnotation).context);
    }
  }

  return undefined;
}

export function ChatLayout() {
  const { toast } = useToast();
  const {
    updateMessages: syncMessagesToStore,
    setIsLoading: setStoreLoading,
    updateBooking,
    sessionId,
  } = useChatStore();

  const {
    messages: aiMessages = [],
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "init",
        role: "assistant",
        content: INITIAL_GREETING,
      },
    ],
    sendExtraMessageFields: true,
    streamProtocol: "data",
    body: { sessionId },
    onError(err) {
      console.error("Chat hook error:", err);
      toast({
        title: "Connection issue",
        description:
          "We couldn't reach the assistant. Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setStoreLoading(isLoading);
  }, [isLoading, setStoreLoading]);

  const appendAssistantMessage = useCallback(
    (content: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
        },
      ]);
    },
    [setMessages],
  );

  useEffect(() => {
    const latestAssistant = [...aiMessages]
      .reverse()
      .find((message) => message.role === "assistant");

    const latestContext = latestAssistant
      ? extractContextFromAnnotations(latestAssistant.annotations)
      : undefined;

    if (latestContext?.type === "error") {
      toast({
        title: "Assistant issue",
        description: latestAssistant?.content ?? "Something went wrong.",
        variant: "destructive",
      });
    }

    if (latestContext?.type === "booking_suggestion") {
      updateBooking(latestContext.details);
    }

    if (latestContext?.type === "booking_confirmed") {
      updateBooking(latestContext.details);
    }
  }, [aiMessages, toast, updateBooking]);

  const renderableMessages = useMemo(() => {
    return aiMessages
      .filter(
        (message) => message.role === "assistant" || message.role === "user",
      )
      .map<Message>((message) => {
        const context = extractContextFromAnnotations(message.annotations);
        const baseMessage: Message = {
          id: message.id ?? crypto.randomUUID(),
          role: message.role as "assistant" | "user",
          content: message.content,
          context,
        };

        if (context?.type === "booking_suggestion") {
          baseMessage.component = <BookingDisplay details={context.details} />;
        }

        if (context?.type === "booking_confirmed") {
          baseMessage.component = (
            <BookingDisplay details={context.details} confirmed />
          );
        }

        if (context?.type === "booking_found") {
          const revivedBooking = reviveBooking(context.booking);

          if (revivedBooking) {
            baseMessage.component = (
              <ModificationFlow
                booking={revivedBooking}
                onModify={async (updates) => {
                  try {
                    const result = await modifyBooking(
                      revivedBooking.confirmationCode,
                      updates,
                    );

                    if (result.success) {
                      updateBooking(updates);
                      toast({
                        title: "Success",
                        description: "Booking updated successfully!",
                      });
                      appendAssistantMessage(FOLLOW_UP_CONFIRMATION);
                    } else {
                      toast({
                        title: "Error",
                        description: result.error || "Failed to update booking",
                        variant: "destructive",
                      });
                    }
                  } catch (err) {
                    console.error("Modify booking failed:", err);
                    toast({
                      title: "Error",
                      description:
                        "Something went wrong updating your booking.",
                      variant: "destructive",
                    });
                  }
                }}
                onCancel={async (reason) => {
                  try {
                    const result = await cancelBookingByCode(
                      revivedBooking.confirmationCode,
                      reason,
                    );

                    if (result.success) {
                      toast({
                        title: "Cancelled",
                        description: "Your booking has been cancelled.",
                      });
                      appendAssistantMessage(FOLLOW_UP_CANCELLATION);
                    } else {
                      toast({
                        title: "Error",
                        description: result.error || "Failed to cancel booking",
                        variant: "destructive",
                      });
                    }
                  } catch (err) {
                    console.error("Cancel booking failed:", err);
                    toast({
                      title: "Error",
                      description:
                        "We could not cancel your booking. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                onClose={() => {
                  appendAssistantMessage(FOLLOW_UP_CLOSE);
                }}
              />
            );
          }
        }

        return baseMessage;
      });
  }, [aiMessages, appendAssistantMessage, toast, updateBooking]);

  useEffect(() => {
    syncMessagesToStore(renderableMessages);
  }, [renderableMessages, syncMessagesToStore]);

  const statusMessage = isLoading
    ? "MastraMind is drafting a reply..."
    : "MastraMind is ready to help.";

  return (
    <div className="flex h-full flex-1 flex-col">
      <ChatMessages messages={renderableMessages} isLoading={isLoading} />
      <div className="mt-auto border-t bg-card/80 p-4">
        <div className="flex items-center justify-between pb-3 text-xs text-muted-foreground">
          <span role="status">{statusMessage}</span>
          {error ? (
            <span className="text-destructive">
              Something went wrong. Retry?
            </span>
          ) : null}
        </div>
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
