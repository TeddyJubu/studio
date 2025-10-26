"use server";

import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase-config";

// Analytics event types
export type AnalyticsEventType =
  | "conversation_started"
  | "message_sent"
  | "booking_initiated"
  | "booking_completed"
  | "booking_abandoned"
  | "booking_modified"
  | "booking_cancelled"
  | "waitlist_joined"
  | "error_occurred"
  | "escalation_triggered"
  | "feedback_submitted"
  | "page_view";

export interface AnalyticsEvent {
  id?: string;
  eventType: AnalyticsEventType;
  sessionId: string;
  customerId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  userAgent?: string;
  referrer?: string;
}

export interface ConversationMetrics {
  totalConversations: number;
  averageMessagesPerConversation: number;
  conversionRate: number;
  averageTimeToBook: number;
  dropOffRate: number;
  topDropOffPoints: { step: string; count: number }[];
  peakHours: { hour: number; count: number }[];
}

export interface BookingMetrics {
  totalBookings: number;
  bookingsByChannel: Record<string, number>;
  bookingsByTimeSlot: Record<string, number>;
  bookingsByPartySize: Record<number, number>;
  advanceBookingDays: number;
  repeatCustomerRate: number;
  noShowRate: number;
  cancellationRate: number;
  modificationRate: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  averageRevenuePerBooking: number;
  revenueByDayOfWeek: Record<string, number>;
  revenueByTimeSlot: Record<string, number>;
  popularOccasions: { occasion: string; count: number }[];
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  topCustomers: {
    id: string;
    name: string;
    totalBookings: number;
    totalSpent: number;
  }[];
  customersByTier: Record<string, number>;
}

export interface AIMetrics {
  intentClassificationAccuracy: number;
  averageConfidence: number;
  escalationRate: number;
  resolutionWithoutHumanRate: number;
  averageResponseTime: number;
  errorRate: number;
  topIntents: { intent: string; count: number }[];
  sentimentDistribution: Record<string, number>;
}

export interface DashboardMetrics {
  conversation: ConversationMetrics;
  booking: BookingMetrics;
  revenue: RevenueMetrics;
  customer: CustomerMetrics;
  ai: AIMetrics;
  timeRange: {
    start: Date;
    end: Date;
  };
}

const ANALYTICS_COLLECTION = "analytics_events";
const BOOKINGS_COLLECTION = "bookings";
const CUSTOMERS_COLLECTION = "customers";

// Track an analytics event
export async function trackEvent(
  event: Omit<AnalyticsEvent, "id" | "timestamp">
): Promise<void> {
  try {
    await addDoc(collection(db, ANALYTICS_COLLECTION), {
      ...event,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error tracking analytics event:", error);
    // Don't throw - analytics shouldn't break the app
  }
}

// Get conversation metrics
export async function getConversationMetrics(
  startDate: Date,
  endDate: Date
): Promise<ConversationMetrics> {
  try {
    const q = query(
      collection(db, ANALYTICS_COLLECTION),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate)),
      where("eventType", "in", [
        "conversation_started",
        "message_sent",
        "booking_completed",
        "booking_abandoned",
      ])
    );

    const snapshot = await getDocs(q);
    const events: AnalyticsEvent[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as AnalyticsEvent);
    });

    // Calculate metrics
    const conversationStarts = events.filter(
      (e) => e.eventType === "conversation_started"
    );
    const messages = events.filter((e) => e.eventType === "message_sent");
    const completedBookings = events.filter(
      (e) => e.eventType === "booking_completed"
    );
    const abandonedBookings = events.filter(
      (e) => e.eventType === "booking_abandoned"
    );

    const totalConversations = conversationStarts.length;
    const averageMessages =
      totalConversations > 0 ? messages.length / totalConversations : 0;
    const conversionRate =
      totalConversations > 0
        ? (completedBookings.length / totalConversations) * 100
        : 0;

    // Calculate average time to book
    const bookingTimes: number[] = [];
    completedBookings.forEach((booking) => {
      if (booking.properties.timeToComplete) {
        bookingTimes.push(booking.properties.timeToComplete);
      }
    });
    const averageTimeToBook =
      bookingTimes.length > 0
        ? bookingTimes.reduce((a, b) => a + b, 0) / bookingTimes.length
        : 0;

    // Drop off rate
    const dropOffRate =
      totalConversations > 0
        ? (abandonedBookings.length / totalConversations) * 100
        : 0;

    // Peak hours
    const hourCounts: Record<number, number> = {};
    conversationStarts.forEach((event) => {
      const hour = event.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalConversations,
      averageMessagesPerConversation: averageMessages,
      conversionRate,
      averageTimeToBook,
      dropOffRate,
      topDropOffPoints: [], // TODO: Implement drop-off point tracking
      peakHours,
    };
  } catch (error) {
    console.error("Error getting conversation metrics:", error);
    throw new Error("Failed to get conversation metrics");
  }
}

// Get booking metrics
export async function getBookingMetrics(
  startDate: Date,
  endDate: Date
): Promise<BookingMetrics> {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      where("createdAt", "<=", Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    const bookings: any[] = [];

    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      });
    });

    const totalBookings = bookings.length;

    // Bookings by channel
    const channelCounts: Record<string, number> = {};
    bookings.forEach((b) => {
      const channel = b.source || "unknown";
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    // Bookings by time slot
    const timeCounts: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.time) {
        timeCounts[b.time] = (timeCounts[b.time] || 0) + 1;
      }
    });

    // Bookings by party size
    const partySizeCounts: Record<number, number> = {};
    bookings.forEach((b) => {
      if (b.partySize) {
        partySizeCounts[b.partySize] = (partySizeCounts[b.partySize] || 0) + 1;
      }
    });

    // Calculate advance booking days
    const advanceDays: number[] = [];
    bookings.forEach((b) => {
      if (b.date && b.createdAt) {
        const bookingDate = new Date(b.date + "T00:00:00");
        const daysDiff = Math.floor(
          (bookingDate.getTime() - b.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        advanceDays.push(daysDiff);
      }
    });
    const averageAdvanceDays =
      advanceDays.length > 0
        ? advanceDays.reduce((a, b) => a + b, 0) / advanceDays.length
        : 0;

    // Calculate rates
    const uniqueCustomers = new Set(
      bookings.map((b) => b.customerId).filter(Boolean)
    );
    const repeatCustomers = bookings.filter((b) => {
      // TODO: Check if customer has previous bookings
      return false;
    });
    const repeatRate =
      totalBookings > 0 ? (repeatCustomers.length / totalBookings) * 100 : 0;

    const noShows = bookings.filter((b) => b.status === "no_show");
    const noShowRate =
      totalBookings > 0 ? (noShows.length / totalBookings) * 100 : 0;

    const cancelled = bookings.filter((b) => b.status === "cancelled");
    const cancellationRate =
      totalBookings > 0 ? (cancelled.length / totalBookings) * 100 : 0;

    // TODO: Track modifications separately
    const modificationRate = 0;

    return {
      totalBookings,
      bookingsByChannel: channelCounts,
      bookingsByTimeSlot: timeCounts,
      bookingsByPartySize: partySizeCounts,
      advanceBookingDays: averageAdvanceDays,
      repeatCustomerRate: repeatRate,
      noShowRate,
      cancellationRate,
      modificationRate,
    };
  } catch (error) {
    console.error("Error getting booking metrics:", error);
    throw new Error("Failed to get booking metrics");
  }
}

// Get customer metrics
export async function getCustomerMetrics(
  startDate: Date,
  endDate: Date
): Promise<CustomerMetrics> {
  try {
    const customersSnapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
    const customers: any[] = [];

    customersSnapshot.forEach((doc) => {
      customers.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      });
    });

    const totalCustomers = customers.length;

    // New customers in time range
    const newCustomers = customers.filter(
      (c) => c.createdAt >= startDate && c.createdAt <= endDate
    ).length;

    const returningCustomers = customers.filter((c) => c.totalVisits > 0).length;

    // Calculate average lifetime value
    const totalValue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const averageLifetimeValue =
      totalCustomers > 0 ? totalValue / totalCustomers : 0;

    // Top customers
    const topCustomers = customers
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        name: c.name || "Unknown",
        totalBookings: c.bookingHistory?.length || 0,
        totalSpent: c.totalSpent || 0,
      }));

    // Customers by tier
    const tierCounts: Record<string, number> = {};
    customers.forEach((c) => {
      const tier = c.tier || "bronze";
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      averageLifetimeValue,
      topCustomers,
      customersByTier: tierCounts,
    };
  } catch (error) {
    console.error("Error getting customer metrics:", error);
    throw new Error("Failed to get customer metrics");
  }
}

// Get AI metrics
export async function getAIMetrics(
  startDate: Date,
  endDate: Date
): Promise<AIMetrics> {
  try {
    const q = query(
      collection(db, ANALYTICS_COLLECTION),
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      where("timestamp", "<=", Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    const events: AnalyticsEvent[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as AnalyticsEvent);
    });

    // Calculate metrics from events
    const totalMessages = events.filter((e) => e.eventType === "message_sent").length;
    const escalations = events.filter(
      (e) => e.eventType === "escalation_triggered"
    ).length;
    const errors = events.filter((e) => e.eventType === "error_occurred").length;

    const escalationRate = totalMessages > 0 ? (escalations / totalMessages) * 100 : 0;
    const errorRate = totalMessages > 0 ? (errors / totalMessages) * 100 : 0;

    // Extract intent data
    const intentCounts: Record<string, number> = {};
    const confidenceScores: number[] = [];
    const sentiments: Record<string, number> = {};

    events.forEach((event) => {
      if (event.properties.intent) {
        const intent = event.properties.intent;
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      }
      if (event.properties.confidence) {
        confidenceScores.push(event.properties.confidence);
      }
      if (event.properties.sentiment) {
        const sentiment = event.properties.sentiment;
        sentiments[sentiment] = (sentiments[sentiment] || 0) + 1;
      }
    });

    const averageConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

    const topIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate resolution rate (bookings completed without escalation)
    const completedBookings = events.filter(
      (e) => e.eventType === "booking_completed"
    ).length;
    const resolutionRate =
      totalMessages > 0 ? ((completedBookings - escalations) / completedBookings) * 100 : 0;

    return {
      intentClassificationAccuracy: 0.92, // TODO: Calculate from validation data
      averageConfidence,
      escalationRate,
      resolutionWithoutHumanRate: Math.max(0, resolutionRate),
      averageResponseTime: 0.5, // TODO: Calculate from actual response times
      errorRate,
      topIntents,
      sentimentDistribution: sentiments,
    };
  } catch (error) {
    console.error("Error getting AI metrics:", error);
    throw new Error("Failed to get AI metrics");
  }
}

// Get complete dashboard metrics
export async function getDashboardMetrics(
  startDate: Date,
  endDate: Date
): Promise<DashboardMetrics> {
  try {
    const [conversation, booking, customer, ai] = await Promise.all([
      getConversationMetrics(startDate, endDate),
      getBookingMetrics(startDate, endDate),
      getCustomerMetrics(startDate, endDate),
      getAIMetrics(startDate, endDate),
    ]);

    // Revenue metrics (simplified - would need actual pricing data)
    const revenue: RevenueMetrics = {
      totalRevenue: booking.totalBookings * 50, // Placeholder: $50 average
      averageRevenuePerBooking: 50,
      revenueByDayOfWeek: {},
      revenueByTimeSlot: {},
      popularOccasions: [],
    };

    return {
      conversation,
      booking,
      revenue,
      customer,
      ai,
      timeRange: {
        start: startDate,
        end: endDate,
      },
    };
  } catch (error) {
    console.error("Error getting dashboard metrics:", error);
    throw new Error("Failed to get dashboard metrics");
  }
}

// Track conversation start
export async function trackConversationStart(sessionId: string): Promise<void> {
  await trackEvent({
    eventType: "conversation_started",
    sessionId,
    properties: {
      timestamp: new Date().toISOString(),
    },
  });
}

// Track message sent
export async function trackMessage(
  sessionId: string,
  role: "user" | "assistant",
  intent?: string,
  confidence?: number
): Promise<void> {
  await trackEvent({
    eventType: "message_sent",
    sessionId,
    properties: {
      role,
      intent,
      confidence,
    },
  });
}

// Track booking completion
export async function trackBookingCompleted(
  sessionId: string,
  bookingId: string,
  timeToComplete: number
): Promise<void> {
  await trackEvent({
    eventType: "booking_completed",
    sessionId,
    properties: {
      bookingId,
      timeToComplete,
    },
  });
}

// Track booking abandonment
export async function trackBookingAbandoned(
  sessionId: string,
  step: string,
  reason?: string
): Promise<void> {
  await trackEvent({
    eventType: "booking_abandoned",
    sessionId,
    properties: {
      step,
      reason,
    },
  });
}
