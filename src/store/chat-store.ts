import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, BookingDetails } from '@/lib/types';

export type ConversationState =
  | 'greeting'
  | 'booking'
  | 'support'
  | 'inquiry'
  | 'confirmation'
  | 'completed';

interface ChatStore {
  // State
  messages: Message[];
  currentBooking: Partial<BookingDetails>;
  conversationState: ConversationState;
  isLoading: boolean;
  error: string | null;
  sessionId: string;

  // Actions
  addMessage: (message: Message) => void;
  updateMessages: (messages: Message[]) => void;
  updateBooking: (details: Partial<BookingDetails>) => void;
  setConversationState: (state: ConversationState) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetConversation: () => void;
  clearBooking: () => void;

  // Selectors
  getLastAssistantMessage: () => Message | undefined;
  getLastUserMessage: () => Message | undefined;
  isBookingComplete: () => boolean;
  getIncompleteFields: () => (keyof BookingDetails)[];
}

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const initialGreeting: Message = {
  id: 'init',
  role: 'assistant',
  content: "Hello! I'm MastraMind, your booking assistant. How can I help you book your appointment today?",
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial State
      messages: [initialGreeting],
      currentBooking: {},
      conversationState: 'greeting',
      isLoading: false,
      error: null,
      sessionId: generateSessionId(),

      // Actions
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
          error: null,
        })),

      updateMessages: (messages) =>
        set({ messages }),

      updateBooking: (details) =>
        set((state) => ({
          currentBooking: { ...state.currentBooking, ...details },
        })),

      setConversationState: (conversationState) =>
        set({ conversationState }),

      setIsLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      resetConversation: () =>
        set({
          messages: [initialGreeting],
          currentBooking: {},
          conversationState: 'greeting',
          isLoading: false,
          error: null,
          sessionId: generateSessionId(),
        }),

      clearBooking: () =>
        set({ currentBooking: {} }),

      // Selectors
      getLastAssistantMessage: () => {
        const messages = get().messages;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'assistant') {
            return messages[i];
          }
        }
        return undefined;
      },

      getLastUserMessage: () => {
        const messages = get().messages;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'user') {
            return messages[i];
          }
        }
        return undefined;
      },

      isBookingComplete: () => {
        const booking = get().currentBooking;
        return !!(
          booking.partySize &&
          booking.date &&
          booking.time
        );
      },

      getIncompleteFields: () => {
        const booking = get().currentBooking;
        const incomplete: (keyof BookingDetails)[] = [];

        if (!booking.partySize) incomplete.push('partySize');
        if (!booking.date) incomplete.push('date');
        if (!booking.time) incomplete.push('time');

        return incomplete;
      },
    }),
    {
      name: 'mastramind-chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        currentBooking: state.currentBooking,
        conversationState: state.conversationState,
        sessionId: state.sessionId,
      }),
    }
  )
);
