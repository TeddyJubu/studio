"use client";

import { Bot, ShieldCheck, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { ChatLayout } from "@/components/chat/chat-layout";

export function ChatShowcase() {
  return (
    <section id="live-demo" className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-card/90 shadow-xl">
        <div className="absolute right-8 top-8 hidden h-40 w-40 rounded-full bg-primary/20 blur-3xl lg:block" aria-hidden />
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/60 bg-card/80">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Bot className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Live Concierge Demo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ask about menus, availability, or modify a booking.
              </p>
            </div>
          </div>
          <Badge className="rounded-full bg-success/15 text-success">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Powered by MastraMind AI
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="p-6">
            <ChatLayout />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 bg-muted/40 px-6 py-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              PCI-safe and SOC2-ready by default
            </div>
            <div>Session resets after 10 minutes of inactivity.</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <StatsCard
          label="Bookings assisted this week"
          value="284"
          trend="up"
          trendLabel="+18% vs. last week"
          helper="AI handles confirmations, custom requests, and waitlist follow-ups."
        />
        <StatsCard
          label="Average satisfaction"
          value="4.8 / 5"
          trend="up"
          trendLabel="Improved tone detection"
          helper="Sentiment routing escalates sensitive chats to human staff instantly."
        />
        <StatsCard
          label="After-hours conversions"
          value="63%"
          trend="flat"
          trendLabel="Stable, 21% above goal"
          helper="Booking intents captured while your team sleeps."
        />
      </div>
    </section>
  );
}

