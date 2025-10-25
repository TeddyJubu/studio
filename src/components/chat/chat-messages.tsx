"use client";

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { ChatAvatar } from './chat-avatar';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollableContainerRef.current) {
      scrollableContainerRef.current.scrollTop =
        scrollableContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={scrollableContainerRef}
      className="flex-1 overflow-y-auto p-4"
    >
      <div className="flex flex-col gap-5">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              'flex items-start gap-3',
              message.role === 'user' && 'justify-end'
            )}
          >
            {message.role === 'assistant' && <ChatAvatar role="assistant" />}
            <div
              className={cn(
                'max-w-md rounded-lg p-3',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.component}
            </div>
            {message.role === 'user' && <ChatAvatar role="user" />}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <ChatAvatar role="assistant" />
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
