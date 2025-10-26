"use server";

import { StreamData, StreamingTextResponse } from "ai";
import type { JSONValue, Message as AIMessages } from "@ai-sdk/ui-utils";
import { formatStreamPart } from "@ai-sdk/ui-utils";

import { getAIResponse } from "@/app/actions";
import type { BookingDetails, Message } from "@/lib/types";
import type { Booking } from "@/services/booking-service";

const CONTEXT_ANNOTATION_KEY = "assistant-context";

type ContextAnnotationPayload = {
  type: string;
  context?: JSONValue;
};

type SerializedContext = JSONValue;

function serializeContext(
  context?: Message["context"],
): SerializedContext | undefined {
  if (!context) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(context, (_key, value) =>
      value instanceof Date ? value.toISOString() : value,
    ),
  ) as SerializedContext;
}

function sanitizeStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

function sanitizeBookingDetails(value: unknown): BookingDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const details: BookingDetails = {};

  if (typeof record.partySize === "number") {
    details.partySize = record.partySize;
  }
  if (typeof record.date === "string") {
    details.date = record.date;
  }
  if (typeof record.time === "string") {
    details.time = record.time;
  }
  if (typeof record.occasion === "string") {
    details.occasion = record.occasion;
  }
  if (typeof record.specialRequests === "string") {
    details.specialRequests = record.specialRequests;
  }
  if (Array.isArray(record.availableSlots)) {
    details.availableSlots = sanitizeStringArray(record.availableSlots);
  }
  if (
    record.dietaryPreferences &&
    typeof record.dietaryPreferences === "object"
  ) {
    const preferences = record.dietaryPreferences as Record<string, unknown>;
    details.dietaryPreferences = {
      dietaryRestrictions:
        sanitizeStringArray(preferences.dietaryRestrictions) ?? [],
      allergens: sanitizeStringArray(preferences.allergens) ?? [],
      preferences: sanitizeStringArray(preferences.preferences) ?? [],
      notes:
        typeof preferences.notes === "string" ? preferences.notes : undefined,
    };
  }
  if (typeof record.customerName === "string") {
    details.customerName = record.customerName;
  }
  if (typeof record.customerEmail === "string") {
    details.customerEmail = record.customerEmail;
  }
  if (typeof record.customerPhone === "string") {
    details.customerPhone = record.customerPhone;
  }

  return details;
}

function deserializeBooking(value: unknown): Booking {
  const fallback: Booking = {
    id: crypto.randomUUID(),
    confirmationCode: "UNKNOWN",
    status: "pending",
    source: "web",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const booking = value as Booking & {
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
        details: sanitizeBookingDetails(record.details),
      };
    case "booking_confirmed":
      return {
        type: "booking_confirmed",
        details: sanitizeBookingDetails(record.details),
        confirmationCode:
          typeof record.confirmationCode === "string"
            ? record.confirmationCode
            : undefined,
      };
    case "booking_found":
      const booking = deserializeBooking(record.booking);

      return {
        type: "booking_found",
        intent:
          record.intent === "modify" ||
          record.intent === "cancel" ||
          record.intent === "lookup"
            ? (record.intent as "lookup" | "modify" | "cancel")
            : "lookup",
        booking,
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
      (annotation as ContextAnnotationPayload).type === CONTEXT_ANNOTATION_KEY
    ) {
      return deserializeContext(
        (annotation as ContextAnnotationPayload).context,
      );
    }
  }

  return undefined;
}

function normalizeMessages(messages: AIMessages[] = []): Message[] {
  return messages
    .filter((message) => ["assistant", "user", "system"].includes(message.role))
    .map((message) => ({
      id: message.id ?? crypto.randomUUID(),
      role:
        message.role === "assistant" || message.role === "user"
          ? message.role
          : "system",
      content: message.content,
      context: extractContextFromAnnotations(message.annotations),
    }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: AIMessages[];
    };

    const normalizedMessages = normalizeMessages(body.messages);
    const assistantResponse = await getAIResponse(normalizedMessages);

    const serializedContext = serializeContext(assistantResponse.context);
    const dataStream =
      serializedContext !== undefined ? new StreamData() : undefined;

    if (dataStream && serializedContext !== undefined) {
      dataStream.appendMessageAnnotation({
        type: CONTEXT_ANNOTATION_KEY,
        context: serializedContext,
      });
      await dataStream.close();
    }

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(formatStreamPart("text", assistantResponse.content)),
        );
        controller.enqueue(
          encoder.encode(
            formatStreamPart("finish_message", {
              finishReason: "stop",
            }),
          ),
        );
        controller.enqueue(
          encoder.encode(
            formatStreamPart("finish_step", {
              finishReason: "stop",
              isContinued: false,
            }),
          ),
        );
        controller.close();
      },
    });

    return new StreamingTextResponse(responseStream, undefined, dataStream);
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Failed to process chat request.", {
      status: 500,
    });
  }
}
