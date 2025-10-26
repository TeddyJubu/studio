import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { HeroSection } from "@/components/landing/hero-section";
import { HighlightsSection } from "@/components/landing/highlights-section";
import { ChatShowcase } from "@/components/chat/chat-showcase";

const navItems = [
  { href: "#features", label: "Product" },
  { href: "#live-demo", label: "Live demo" },
  { href: "#pricing", label: "Pricing" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">MM</span>
            MastraMind Studio
          </Link>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink href={item.href}>{item.label}</NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/docs">Docs</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/dashboard">
                Open Studio
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        <HeroSection />

        <section id="features" className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Why platforms choose MastraMind</span>
            <h2 className="text-2xl font-headline font-semibold text-foreground">Purpose-built for guest experience teams</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Blend conversational AI with your existing operations. MastraMind unifies bookings, loyalty signals, and service workflows—no rip-and-replace required.
            </p>
          </div>
          <HighlightsSection />
        </section>

        <ChatShowcase />

        <section id="pricing" className="grid gap-6 rounded-3xl border border-border/60 bg-card/90 p-8 text-sm text-muted-foreground">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-headline font-semibold text-foreground">Simple usage-based pricing</h2>
            <p>Starter tier includes 500 AI-routed conversations. Scale plans unlock dedicated fine-tuning, white-label widgets, and premium analytics.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-6">
              <h3 className="text-lg font-semibold text-foreground">Starter</h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">$99<span className="text-sm text-muted-foreground"> / month</span></p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• 500 conversations</li>
                <li>• Booking + menu knowledge</li>
                <li>• Email + Slack alerts</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-primary/70 bg-primary/10 p-6">
              <h3 className="text-lg font-semibold text-foreground">Growth</h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">$249<span className="text-sm text-muted-foreground"> / month</span></p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• 2k conversations</li>
                <li>• Multi-location routing</li>
                <li>• Feedback + sentiment reports</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-6">
              <h3 className="text-lg font-semibold text-foreground">Enterprise</h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">Custom</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Unlimited conversations</li>
                <li>• Dedicated success engineer</li>
                <li>• SOC2 + regional compliance</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/80">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} MastraMind. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="mailto:support@mastramind.ai" className="hover:text-foreground">support@mastramind.ai</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
