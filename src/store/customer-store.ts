import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;

  // Preferences
  preferences: {
    dietaryRestrictions: string[];
    allergens: string[];
    favoriteTable?: string;
    preferredTimeSlots: string[];
    communicationPreferences: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
    };
  };

  // History
  bookingHistory: string[]; // Array of booking IDs
  totalVisits: number;
  totalSpent: number;
  averagePartySize: number;
  noShowCount: number;
  cancellationCount: number;

  // Loyalty
  loyaltyPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  specialOccasions: SpecialOccasion[];
}

export interface SpecialOccasion {
  type: 'birthday' | 'anniversary' | 'custom';
  date: string; // MM-DD format
  notification: boolean;
  notes?: string;
}

interface CustomerStore {
  // State
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setCustomer: (customer: CustomerProfile | null) => void;
  updateCustomer: (updates: Partial<CustomerProfile>) => void;
  updatePreferences: (preferences: Partial<CustomerProfile['preferences']>) => void;
  addBookingToHistory: (bookingId: string) => void;
  incrementVisits: () => void;
  incrementNoShows: () => void;
  incrementCancellations: () => void;
  addLoyaltyPoints: (points: number) => void;
  updateTier: (tier: CustomerProfile['tier']) => void;
  addSpecialOccasion: (occasion: SpecialOccasion) => void;
  removeSpecialOccasion: (index: number) => void;
  logout: () => void;
  setIsLoading: (loading: boolean) => void;

  // Selectors
  isVIP: () => boolean;
  hasVisited: () => boolean;
  getDietaryInfo: () => string[];
}

const defaultPreferences: CustomerProfile['preferences'] = {
  dietaryRestrictions: [],
  allergens: [],
  preferredTimeSlots: [],
  communicationPreferences: {
    email: true,
    sms: false,
    whatsapp: false,
  },
};

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      // Initial State
      customer: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setCustomer: (customer) =>
        set({
          customer,
          isAuthenticated: !!customer,
        }),

      updateCustomer: (updates) =>
        set((state) => ({
          customer: state.customer
            ? { ...state.customer, ...updates }
            : null,
        })),

      updatePreferences: (preferences) =>
        set((state) => ({
          customer: state.customer
            ? {
                ...state.customer,
                preferences: { ...state.customer.preferences, ...preferences },
              }
            : null,
        })),

      addBookingToHistory: (bookingId) =>
        set((state) => ({
          customer: state.customer
            ? {
                ...state.customer,
                bookingHistory: [...state.customer.bookingHistory, bookingId],
              }
            : null,
        })),

      incrementVisits: () =>
        set((state) => ({
          customer: state.customer
            ? {
                ...state.customer,
                totalVisits: state.customer.totalVisits + 1,
              }
            : null,
        })),

      incrementNoShows: () =>
        set((state) => ({
          customer: state.customer
            ? {
                ...state.customer,
                noShowCount: state.customer.noShowCount + 1,
              }
            : null,
        })),

      incrementCancellations: () =>
        set((state) => ({
          customer: state.customer
            ? {
                ...state.customer,
                cancellationCount: state.customer.cancellationCount + 1,
              }
            : null,
        })),

      addLoyaltyPoints: (points) =>
        set((state) => ({
          customer: state.customer
            ? {
                ...state.customer,
                loyaltyPoints: state.customer.loyaltyPoints + points,
              }
            : null,
        })),

      updateTier: (tier) =>
        set((state) => ({
          customer: state.customer
            ? {
                ...state.customer,
                tier,
              }
            : null,
        })),

      addSpecialOccasion: (occasion) =>
        set((state) => ({
          customer: state.customer
            ? {
                ...state.customer,
                specialOccasions: [...state.customer.specialOccasions, occasion],
              }
            : null,
        })),

      removeSpecialOccasion: (index) =>
        set((state) => ({
          customer: state.customer
            ? {
                ...state.customer,
                specialOccasions: state.customer.specialOccasions.filter(
                  (_, i) => i !== index
                ),
              }
            : null,
        })),

      logout: () =>
        set({
          customer: null,
          isAuthenticated: false,
        }),

      setIsLoading: (isLoading) =>
        set({ isLoading }),

      // Selectors
      isVIP: () => {
        const customer = get().customer;
        if (!customer) return false;
        return customer.tier === 'gold' || customer.tier === 'platinum';
      },

      hasVisited: () => {
        const customer = get().customer;
        return !!customer && customer.totalVisits > 0;
      },

      getDietaryInfo: () => {
        const customer = get().customer;
        if (!customer) return [];
        return [
          ...customer.preferences.dietaryRestrictions,
          ...customer.preferences.allergens.map((a) => `allergic to ${a}`),
        ];
      },
    }),
    {
      name: 'mastramind-customer-storage',
      partialize: (state) => ({
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
