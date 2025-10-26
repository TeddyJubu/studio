import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[2.75rem] border border-border/60 bg-gradient-to-br from-background via-card to-secondary/60 px-6 py-16 shadow-lg md:px-12 lg:px-20",
        className
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]" />
      <div className="flex flex-col gap-8 md:max-w-2xl">
        <Badge className="w-fit rounded-full bg-primary/10 text-primary">
          <Sparkles className="mr-2 h-3 w-3" />
          AI Concierge for Restaurants & Services
        </Badge>
        <div className="space-y-6">
          <h1 className="text-4xl font-headline font-semibold leading-tight text-foreground sm:text-5xl">
            Elevate bookings with a human-like AI that knows your menu and schedule.
          </h1>
          <p className="text-lg text-muted-foreground">
            MastraMind automates front-of-house conversations, captures reservations, and syncs with your teams so every guest feels like a VIP.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              Launch Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#live-demo">View Live Demo</Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">92% faster</p>
            <p>response times for inbound chats</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">+37% bookings</p>
            <p>captured outside business hours</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">24/7 coverage</p>
            <p>with sentiment-aware AI follow-ups</p>
          </div>
        </div>
      </div>
      <div className="absolute right-6 top-6 hidden h-32 w-32 rounded-full bg-primary/20 blur-3xl md:block" aria-hidden />
    </section>
  );
}
