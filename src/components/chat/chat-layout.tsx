"use client";

import { useState } from 'react';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { getAIResponse } from '@/app/actions';
import type { Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AppointmentDisplay } from './appointment-display';
import { CalendarDisplay } from './calendar-display';

export function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        "Hello! I'm MastraMind. How can I assist you today? You can ask me questions or book an appointment, for example: 'Book a haircut for tomorrow at 2pm'.",
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

      if (assistantMessage.context?.type === 'appointment_suggestion') {
        assistantMessage.component = <AppointmentDisplay details={assistantMessage.context.details} />;
      }
      if (assistantMessage.context?.type === 'appointment_confirmed') {
        assistantMessage.component = <AppointmentDisplay details={assistantMessage.context.details} confirmed={true} />;
      }
      if (assistantMessage.context?.type === 'calendar' && 'slots' in assistantMessage.context) {
        assistantMessage.component = <CalendarDisplay availableSlots={assistantMessage.context.slots as string[]} />;
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
