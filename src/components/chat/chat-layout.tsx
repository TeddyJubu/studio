"use client";

import { useState } from 'react';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { getAIResponse } from '@/app/actions';
import type { Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { BookingDisplay } from './booking-display';

export function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        "Hello! I'm MastraMind, your booking assistant. How can I help you book your appointment today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (content: string) => {
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const assistantResponse = await getAIResponse(newMessages);
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        ...assistantResponse
      };

      if (assistantMessage.context?.type === 'booking_suggestion') {
        assistantMessage.component = <BookingDisplay details={assistantMessage.context.details} />;
      }
      if (assistantMessage.context?.type === 'booking_confirmed') {
        assistantMessage.component = <BookingDisplay details={assistantMessage.context.details} confirmed={true} />;
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response from the AI. Please try again.',
        variant: 'destructive',
      });
      // remove the user message if AI fails
      setMessages(prev => prev.slice(0, -1));
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
