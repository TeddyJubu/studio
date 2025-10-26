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
import type { BookingDetails } from "@/lib/types";

export interface Booking {
  id: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  confirmationCode: string;

  // BookingDetails fields
  partySize?: number;
  date?: string;
  time?: string;
  occasion?: string;
  specialRequests?: string;
  availableSlots?: string[];

  status:
    | "pending"
    | "confirmed"
    | "seated"
    | "completed"
    | "cancelled"
    | "no_show";
  source: "web" | "sms" | "phone" | "walkin";
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
}

const BOOKINGS_COLLECTION = "bookings";

// Generate confirmation code
function generateConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new booking
export async function createBooking(
  bookingDetails: BookingDetails,
  customerInfo?: {
    customerId?: string;
    name?: string;
    email?: string;
    phone?: string;
  },
): Promise<Booking> {
  try {
    const confirmationCode = generateConfirmationCode();

    const bookingData = {
      ...bookingDetails,
      customerId: customerInfo?.customerId,
      customerName: customerInfo?.name,
      customerEmail: customerInfo?.email,
      customerPhone: customerInfo?.phone,
      confirmationCode,
      status: "pending" as const,
      source: "web" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, BOOKINGS_COLLECTION),
      bookingData,
    );

    const booking: Booking = {
      id: docRef.id,
      ...bookingDetails,
      customerId: customerInfo?.customerId,
      customerName: customerInfo?.name,
      customerEmail: customerInfo?.email,
      customerPhone: customerInfo?.phone,
      confirmationCode,
      status: "pending",
      source: "web",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return booking;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw new Error("Failed to create booking");
  }
}

// Get booking by ID
export async function getBookingById(
  bookingId: string,
): Promise<Booking | null> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      cancelledAt: data.cancelledAt?.toDate(),
    } as Booking;
  } catch (error) {
    console.error("Error getting booking:", error);
    throw new Error("Failed to get booking");
  }
}

// Get booking by confirmation code
export async function getBookingByConfirmationCode(
  confirmationCode: string,
): Promise<Booking | null> {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where("confirmationCode", "==", confirmationCode.toUpperCase()),
      limit(1),
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();

    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      cancelledAt: data.cancelledAt?.toDate(),
    } as Booking;
  } catch (error) {
    console.error("Error getting booking by confirmation code:", error);
    throw new Error("Failed to get booking");
  }
}

// Get bookings by customer
export async function getBookingsByCustomer(
  customerId: string,
  status?: Booking["status"],
): Promise<Booking[]> {
  try {
    let q = query(
      collection(db, BOOKINGS_COLLECTION),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc"),
    );

    if (status) {
      q = query(q, where("status", "==", status));
    }

    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        cancelledAt: data.cancelledAt?.toDate(),
      } as Booking);
    });

    return bookings;
  } catch (error) {
    console.error("Error getting customer bookings:", error);
    throw new Error("Failed to get bookings");
  }
}

// Get bookings by date
export async function getBookingsByDate(date: string): Promise<Booking[]> {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where("date", "==", date),
      orderBy("time", "asc"),
    );

    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        cancelledAt: data.cancelledAt?.toDate(),
      } as Booking);
    });

    return bookings;
  } catch (error) {
    console.error("Error getting bookings by date:", error);
    throw new Error("Failed to get bookings");
  }
}

// Update booking
export async function updateBooking(
  bookingId: string,
  updates: Partial<BookingDetails>,
): Promise<Booking> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    const updatedBooking = await getBookingById(bookingId);

    if (!updatedBooking) {
      throw new Error("Booking not found after update");
    }

    return updatedBooking;
  } catch (error) {
    console.error("Error updating booking:", error);
    throw new Error("Failed to update booking");
  }
}

// Confirm booking
export async function confirmBooking(bookingId: string): Promise<Booking> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);

    await updateDoc(docRef, {
      status: "confirmed",
      updatedAt: serverTimestamp(),
    });

    const confirmedBooking = await getBookingById(bookingId);

    if (!confirmedBooking) {
      throw new Error("Booking not found after confirmation");
    }

    return confirmedBooking;
  } catch (error) {
    console.error("Error confirming booking:", error);
    throw new Error("Failed to confirm booking");
  }
}

// Cancel booking
export async function cancelBooking(
  bookingId: string,
  reason?: string,
): Promise<Booking> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);

    await updateDoc(docRef, {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
      cancellationReason: reason,
      updatedAt: serverTimestamp(),
    });

    const cancelledBooking = await getBookingById(bookingId);

    if (!cancelledBooking) {
      throw new Error("Booking not found after cancellation");
    }

    return cancelledBooking;
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw new Error("Failed to cancel booking");
  }
}

// Mark as no-show
export async function markAsNoShow(bookingId: string): Promise<Booking> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);

    await updateDoc(docRef, {
      status: "no_show",
      updatedAt: serverTimestamp(),
    });

    const noShowBooking = await getBookingById(bookingId);

    if (!noShowBooking) {
      throw new Error("Booking not found after marking as no-show");
    }

    return noShowBooking;
  } catch (error) {
    console.error("Error marking booking as no-show:", error);
    throw new Error("Failed to mark as no-show");
  }
}

// Delete booking (soft delete by marking as cancelled)
export async function deleteBooking(bookingId: string): Promise<void> {
  try {
    await cancelBooking(bookingId, "Deleted by user");
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw new Error("Failed to delete booking");
  }
}

// Check if slot is available
export async function isSlotAvailable(
  date: string,
  time: string,
  partySize: number,
  excludeBookingId?: string,
): Promise<boolean> {
  try {
    const bookings = await getBookingsByDate(date);

    // Filter out cancelled/no-show bookings and the excluded booking
    const activeBookings = bookings.filter(
      (b) =>
        b.time === time &&
        b.status !== "cancelled" &&
        b.status !== "no_show" &&
        b.id !== excludeBookingId,
    );

    // Calculate total party size for this time slot
    const totalPartySize = activeBookings.reduce(
      (sum, b) => sum + (b.partySize || 0),
      0,
    );

    // Assuming restaurant capacity of 20 per time slot (configurable)
    const CAPACITY_PER_SLOT = 20;

    return totalPartySize + partySize <= CAPACITY_PER_SLOT;
  } catch (error) {
    console.error("Error checking slot availability:", error);
    return false;
  }
}

// Get available time slots for a date
export async function getAvailableTimeSlots(
  date: string,
  partySize: number,
): Promise<string[]> {
  try {
    const allTimeSlots = [
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
    ];

    const availableSlots: string[] = [];

    for (const time of allTimeSlots) {
      const available = await isSlotAvailable(date, time, partySize);
      if (available) {
        availableSlots.push(time);
      }
    }

    return availableSlots;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    return [];
  }
}
