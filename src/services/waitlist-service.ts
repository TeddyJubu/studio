"use server";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import { getAvailableTimeSlots } from "./booking-service";

export interface WaitlistEntry {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTime?: string; // HH:MM - optional if flexible
  partySize: number;
  flexibleTimes: string[]; // Acceptable alternative times
  flexibleDates: string[]; // Acceptable alternative dates
  contactMethod: "sms" | "email" | "both";
  priority: number; // Higher = more priority (based on loyalty, frequency)
  status: "active" | "notified" | "converted" | "expired" | "cancelled";
  createdAt: Date;
  expiresAt: Date;
  notifiedAt?: Date;
  convertedAt?: Date;
  notes?: string;
}

const WAITLIST_COLLECTION = "waitlist";

// Create a waitlist entry
export async function createWaitlistEntry(
  data: Omit<
    WaitlistEntry,
    "id" | "status" | "createdAt" | "expiresAt" | "priority"
  >
): Promise<WaitlistEntry> {
  try {
    // Calculate priority (could be enhanced with loyalty tier, etc.)
    const priority = calculatePriority({
      customerId: data.customerId,
      flexibility: data.flexibleTimes.length + data.flexibleDates.length,
    });

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const entryData = {
      ...data,
      priority,
      status: "active" as const,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    };

    const docRef = await addDoc(
      collection(db, WAITLIST_COLLECTION),
      entryData
    );

    const entry: WaitlistEntry = {
      id: docRef.id,
      ...data,
      priority,
      status: "active",
      createdAt: new Date(),
      expiresAt,
    };

    return entry;
  } catch (error) {
    console.error("Error creating waitlist entry:", error);
    throw new Error("Failed to create waitlist entry");
  }
}

// Get waitlist entry by ID
export async function getWaitlistEntryById(
  entryId: string
): Promise<WaitlistEntry | null> {
  try {
    const docRef = doc(db, WAITLIST_COLLECTION, entryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      notifiedAt: data.notifiedAt?.toDate(),
      convertedAt: data.convertedAt?.toDate(),
    } as WaitlistEntry;
  } catch (error) {
    console.error("Error getting waitlist entry:", error);
    throw new Error("Failed to get waitlist entry");
  }
}

// Get waitlist entries by customer
export async function getWaitlistEntriesByCustomer(
  customerId: string,
  activeOnly = true
): Promise<WaitlistEntry[]> {
  try {
    let q = query(
      collection(db, WAITLIST_COLLECTION),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc")
    );

    if (activeOnly) {
      q = query(q, where("status", "==", "active"));
    }

    const querySnapshot = await getDocs(q);
    const entries: WaitlistEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        notifiedAt: data.notifiedAt?.toDate(),
        convertedAt: data.convertedAt?.toDate(),
      } as WaitlistEntry);
    });

    return entries;
  } catch (error) {
    console.error("Error getting customer waitlist entries:", error);
    throw new Error("Failed to get waitlist entries");
  }
}

// Get waitlist entries for a specific date/time
export async function getWaitlistEntriesForSlot(
  date: string,
  time?: string
): Promise<WaitlistEntry[]> {
  try {
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where("requestedDate", "==", date),
      where("status", "==", "active"),
      orderBy("priority", "desc"),
      orderBy("createdAt", "asc")
    );

    const querySnapshot = await getDocs(q);
    const entries: WaitlistEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const entry = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
        notifiedAt: data.notifiedAt?.toDate(),
        convertedAt: data.convertedAt?.toDate(),
      } as WaitlistEntry;

      // If time is specified, filter by exact time or flexible times
      if (time) {
        if (
          entry.requestedTime === time ||
          entry.flexibleTimes.includes(time) ||
          !entry.requestedTime // If no specific time, include all
        ) {
          entries.push(entry);
        }
      } else {
        entries.push(entry);
      }
    });

    return entries;
  } catch (error) {
    console.error("Error getting waitlist entries for slot:", error);
    throw new Error("Failed to get waitlist entries");
  }
}

// Update waitlist entry status
export async function updateWaitlistStatus(
  entryId: string,
  status: WaitlistEntry["status"]
): Promise<WaitlistEntry> {
  try {
    const docRef = doc(db, WAITLIST_COLLECTION, entryId);
    const updates: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === "notified") {
      updates.notifiedAt = serverTimestamp();
    } else if (status === "converted") {
      updates.convertedAt = serverTimestamp();
    }

    await updateDoc(docRef, updates);

    const updatedEntry = await getWaitlistEntryById(entryId);

    if (!updatedEntry) {
      throw new Error("Waitlist entry not found after update");
    }

    return updatedEntry;
  } catch (error) {
    console.error("Error updating waitlist status:", error);
    throw new Error("Failed to update waitlist status");
  }
}

// Cancel waitlist entry
export async function cancelWaitlistEntry(entryId: string): Promise<void> {
  try {
    await updateWaitlistStatus(entryId, "cancelled");
  } catch (error) {
    console.error("Error cancelling waitlist entry:", error);
    throw new Error("Failed to cancel waitlist entry");
  }
}

// Process waitlist when a slot becomes available
export async function processWaitlistForSlot(
  date: string,
  time: string,
  partySize: number
): Promise<WaitlistEntry[]> {
  try {
    // Get all matching waitlist entries
    const entries = await getWaitlistEntriesForSlot(date, time);

    // Filter entries that can fit in the available slot
    const matchingEntries = entries.filter(
      (entry) => entry.partySize <= partySize && entry.status === "active"
    );

    // Sort by priority
    matchingEntries.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return matchingEntries;
  } catch (error) {
    console.error("Error processing waitlist:", error);
    throw new Error("Failed to process waitlist");
  }
}

// Check and notify waitlist entries (should be run periodically)
export async function checkAndNotifyWaitlist(): Promise<{
  notified: number;
  errors: string[];
}> {
  try {
    let notifiedCount = 0;
    const errors: string[] = [];

    // Get all active waitlist entries
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    const entries: WaitlistEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(),
      } as WaitlistEntry);
    });

    // Check each entry
    for (const entry of entries) {
      try {
        // Check if entry has expired
        if (entry.expiresAt < new Date()) {
          await updateWaitlistStatus(entry.id, "expired");
          continue;
        }

        // Check if slot is available
        const availableSlots = await getAvailableTimeSlots(
          entry.requestedDate,
          entry.partySize
        );

        // Check if requested time is available
        const hasRequestedTime =
          entry.requestedTime && availableSlots.includes(entry.requestedTime);

        // Check if any flexible time is available
        const hasFlexibleTime = entry.flexibleTimes.some((time) =>
          availableSlots.includes(time)
        );

        if (hasRequestedTime || hasFlexibleTime || availableSlots.length > 0) {
          // Slot available! Notify customer
          await notifyCustomer(entry, availableSlots);
          await updateWaitlistStatus(entry.id, "notified");
          notifiedCount++;
        }
      } catch (error) {
        console.error(`Error processing waitlist entry ${entry.id}:`, error);
        errors.push(
          `Entry ${entry.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return { notified: notifiedCount, errors };
  } catch (error) {
    console.error("Error checking waitlist:", error);
    throw new Error("Failed to check waitlist");
  }
}

// Notify customer about available slot (placeholder - needs SMS/email implementation)
async function notifyCustomer(
  entry: WaitlistEntry,
  availableSlots: string[]
): Promise<void> {
  // TODO: Implement actual notification via SMS/email
  console.log(`Notifying ${entry.customerName} about available slots:`, {
    entryId: entry.id,
    date: entry.requestedDate,
    availableSlots,
    contactMethod: entry.contactMethod,
    phone: entry.customerPhone,
    email: entry.customerEmail,
  });

  // In production, this would:
  // 1. Send SMS via Twilio if contactMethod includes 'sms'
  // 2. Send email if contactMethod includes 'email'
  // 3. Include a link to book the slot with a time limit
  // 4. Set up a notification response window (e.g., 15 minutes)
}

// Calculate priority for waitlist entry
function calculatePriority(data: {
  customerId?: string;
  flexibility: number;
}): number {
  let priority = 50; // Base priority

  // Add points for flexibility (more flexible = higher priority)
  priority += data.flexibility * 5;

  // TODO: Add points based on customer tier/loyalty
  // if (customer.tier === 'platinum') priority += 30;
  // if (customer.tier === 'gold') priority += 20;
  // if (customer.tier === 'silver') priority += 10;

  // TODO: Add points for frequency
  // if (customer.totalVisits > 20) priority += 15;

  return Math.min(priority, 100); // Cap at 100
}

// Get waitlist statistics
export async function getWaitlistStats(): Promise<{
  totalActive: number;
  totalNotified: number;
  totalConverted: number;
  totalExpired: number;
  conversionRate: number;
}> {
  try {
    const querySnapshot = await getDocs(collection(db, WAITLIST_COLLECTION));

    let totalActive = 0;
    let totalNotified = 0;
    let totalConverted = 0;
    let totalExpired = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      switch (data.status) {
        case "active":
          totalActive++;
          break;
        case "notified":
          totalNotified++;
          break;
        case "converted":
          totalConverted++;
          break;
        case "expired":
          totalExpired++;
          break;
      }
    });

    const conversionRate =
      totalNotified > 0 ? (totalConverted / totalNotified) * 100 : 0;

    return {
      totalActive,
      totalNotified,
      totalConverted,
      totalExpired,
      conversionRate,
    };
  } catch (error) {
    console.error("Error getting waitlist stats:", error);
    throw new Error("Failed to get waitlist stats");
  }
}

// Clean up expired entries (should be run periodically)
export async function cleanupExpiredEntries(): Promise<number> {
  try {
    const now = new Date();
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where("expiresAt", "<", Timestamp.fromDate(now)),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    let cleaned = 0;

    for (const docSnapshot of querySnapshot.docs) {
      await updateDoc(docSnapshot.ref, {
        status: "expired",
        updatedAt: serverTimestamp(),
      });
      cleaned++;
    }

    return cleaned;
  } catch (error) {
    console.error("Error cleaning up expired entries:", error);
    throw new Error("Failed to cleanup expired entries");
  }
}
