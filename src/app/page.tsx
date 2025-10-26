import { ChatLayout } from '@/components/chat/chat-layout';
import { Bot, Cog } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex h-[calc(100dvh)] w-full flex-col items-center justify-center gap-4 bg-background p-2 sm:p-4">
      <div className="z-10 flex h-full w-full max-w-4xl flex-col rounded-xl border bg-card shadow-lg">
        <header className="flex items-center justify-between rounded-t-xl border-b bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-headline text-primary md:text-2xl">
                MastraMind
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered restaurant & service booking
              </p>
            </div>
          </div>
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard">
              <Cog className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </Button>
        </header>
        <ChatLayout />
      </div>
    </main>
  );
}
