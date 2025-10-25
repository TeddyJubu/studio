import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatAvatarProps {
  role: 'user' | 'assistant';
}

export function ChatAvatar({ role }: ChatAvatarProps) {
  return (
    <Avatar
      className={cn(
        'h-8 w-8',
        role === 'user'
          ? 'bg-primary/20 text-primary'
          : 'bg-muted-foreground/20 text-muted-foreground'
      )}
    >
      <AvatarFallback>
        {role === 'user' ? (
          <User className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
