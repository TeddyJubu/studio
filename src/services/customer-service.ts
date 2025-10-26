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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import type { CustomerProfile, SpecialOccasion } from '@/store/customer-store';

const CUSTOMERS_COLLECTION = 'customers';

// Create a new customer profile
export async function createCustomerProfile(
  data: Omit<CustomerProfile, 'id' | 'createdAt' | 'bookingHistory' | 'totalVisits' | 'totalSpent' | 'averagePartySize' | 'noShowCount' | 'cancellationCount' | 'loyaltyPoints' | 'tier' | 'specialOccasions'>
): Promise<CustomerProfile> {
  try {
    const customerData = {
      ...data,
      bookingHistory: [],
      totalVisits: 0,
      totalSpent: 0,
      averagePartySize: 0,
      noShowCount: 0,
      cancellationCount: 0,
      loyaltyPoints: 0,
      tier: 'bronze' as const,
      specialOccasions: [],
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), customerData);

    const customer: CustomerProfile = {
      id: docRef.id,
      ...data,
      bookingHistory: [],
      totalVisits: 0,
      totalSpent: 0,
      averagePartySize: 0,
      noShowCount: 0,
      cancellationCount: 0,
      loyaltyPoints: 0,
      tier: 'bronze',
      specialOccasions: [],
      createdAt: new Date(),
    };

    return customer;
  } catch (error) {
    console.error('Error creating customer profile:', error);
    throw new Error('Failed to create customer profile');
  }
}

// Get customer by ID
export async function getCustomerById(customerId: string): Promise<CustomerProfile | null> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as CustomerProfile;
  } catch (error) {
    console.error('Error getting customer:', error);
    throw new Error('Failed to get customer');
  }
}

// Get customer by email
export async function getCustomerByEmail(email: string): Promise<CustomerProfile | null> {
  try {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('email', '==', email.toLowerCase()),
      limit(1)
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
    } as CustomerProfile;
  } catch (error) {
    console.error('Error getting customer by email:', error);
    throw new Error('Failed to get customer');
  }
}

// Get customer by phone
export async function getCustomerByPhone(phone: string): Promise<CustomerProfile | null> {
  try {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('phone', '==', phone),
      limit(1)
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
    } as CustomerProfile;
  } catch (error) {
    console.error('Error getting customer by phone:', error);
    throw new Error('Failed to get customer');
  }
}

// Update customer profile
export async function updateCustomerProfile(
  customerId: string,
  updates: Partial<Omit<CustomerProfile, 'id' | 'createdAt'>>
): Promise<CustomerProfile> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);

    await updateDoc(docRef, updates);

    const updatedCustomer = await getCustomerById(customerId);

    if (!updatedCustomer) {
      throw new Error('Customer not found after update');
    }

    return updatedCustomer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }
}

// Update customer preferences
export async function updateCustomerPreferences(
  customerId: string,
  preferences: Partial<CustomerProfile['preferences']>
): Promise<CustomerProfile> {
  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedPreferences = {
      ...customer.preferences,
      ...preferences,
    };

    return updateCustomerProfile(customerId, {
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating customer preferences:', error);
    throw new Error('Failed to update preferences');
  }
}

// Add booking to customer history
export async function addBookingToCustomerHistory(
  customerId: string,
  bookingId: string
): Promise<void> {
  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedHistory = [...customer.bookingHistory, bookingId];

    await updateCustomerProfile(customerId, {
      bookingHistory: updatedHistory,
    });
  } catch (error) {
    console.error('Error adding booking to history:', error);
    throw new Error('Failed to add booking to history');
  }
}

// Increment customer visits
export async function incrementCustomerVisits(customerId: string): Promise<void> {
  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    await updateCustomerProfile(customerId, {
      totalVisits: customer.totalVisits + 1,
    });

    // Auto-upgrade tier based on visits
    await updateCustomerTierBasedOnVisits(customerId, customer.totalVisits + 1);
  } catch (error) {
    console.error('Error incrementing visits:', error);
    throw new Error('Failed to increment visits');
  }
}

// Update customer tier based on visits
async function updateCustomerTierBasedOnVisits(
  customerId: string,
  visits: number
): Promise<void> {
  let newTier: CustomerProfile['tier'] = 'bronze';

  if (visits >= 50) {
    newTier = 'platinum';
  } else if (visits >= 25) {
    newTier = 'gold';
  } else if (visits >= 10) {
    newTier = 'silver';
  }

  await updateCustomerProfile(customerId, { tier: newTier });
}

// Add loyalty points
export async function addLoyaltyPoints(
  customerId: string,
  points: number
): Promise<void> {
  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    await updateCustomerProfile(customerId, {
      loyaltyPoints: customer.loyaltyPoints + points,
    });
  } catch (error) {
    console.error('Error adding loyalty points:', error);
    throw new Error('Failed to add loyalty points');
  }
}

// Add special occasion
export async function addSpecialOccasion(
  customerId: string,
  occasion: SpecialOccasion
): Promise<void> {
  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedOccasions = [...customer.specialOccasions, occasion];

    await updateCustomerProfile(customerId, {
      specialOccasions: updatedOccasions,
    });
  } catch (error) {
    console.error('Error adding special occasion:', error);
    throw new Error('Failed to add special occasion');
  }
}

// Remove special occasion
export async function removeSpecialOccasion(
  customerId: string,
  index: number
): Promise<void> {
  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedOccasions = customer.specialOccasions.filter((_, i) => i !== index);

    await updateCustomerProfile(customerId, {
      specialOccasions: updatedOccasions,
    });
  } catch (error) {
    console.error('Error removing special occasion:', error);
    throw new Error('Failed to remove special occasion');
  }
}

// Record no-show
export async function recordNoShow(customerId: string): Promise<void> {
  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    await updateCustomerProfile(customerId, {
      noShowCount: customer.noShowCount + 1,
    });
  } catch (error) {
    console.error('Error recording no-show:', error);
    throw new Error('Failed to record no-show');
  }
}

// Record cancellation
export async function recordCancellation(customerId: string): Promise<void> {
  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    await updateCustomerProfile(customerId, {
      cancellationCount: customer.cancellationCount + 1,
    });
  } catch (error) {
    console.error('Error recording cancellation:', error);
    throw new Error('Failed to record cancellation');
  }
}

// Get or create customer by contact info
export async function getOrCreateCustomer(
  email?: string,
  phone?: string,
  name?: string
): Promise<CustomerProfile | null> {
  try {
    // Try to find existing customer
    if (email) {
      const existingCustomer = await getCustomerByEmail(email);
      if (existingCustomer) return existingCustomer;
    }

    if (phone) {
      const existingCustomer = await getCustomerByPhone(phone);
      if (existingCustomer) return existingCustomer;
    }

    // Create new customer if we have enough info
    if (email || phone) {
      return createCustomerProfile({
        name: name || 'Guest',
        email: email || '',
        phone: phone || '',
        preferences: {
          dietaryRestrictions: [],
          allergens: [],
          preferredTimeSlots: [],
          communicationPreferences: {
            email: !!email,
            sms: !!phone,
            whatsapp: false,
          },
        },
      });
    }

    return null;
  } catch (error) {
    console.error('Error getting or creating customer:', error);
    return null;
  }
}

// Delete customer (GDPR compliance)
export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer');
  }
}
