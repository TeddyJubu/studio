import { CalendarCheck, MessageSquareText, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";

const highlights = [
  {
    icon: MessageSquareText,
    title: "Conversational intelligence",
    description: "Context-aware replies pull from your playbook, dietary rules, and upsell prompts in real time.",
  },
  {
    icon: CalendarCheck,
    title: "Automated scheduling",
    description: "Two-way calendar sync reserves, modifies, or cancels appointments with audit-ready trails.",
  },
  {
    icon: Workflow,
    title: "Service workflows",
    description: "Route complex requests to humans, trigger loyalty perks, and capture sentiment for every guest.",
  },
];

interface HighlightsSectionProps {
  className?: string;
}

export function HighlightsSection({ className }: HighlightsSectionProps) {
  return (
    <section className={cn("grid gap-6 md:grid-cols-3", className)}>
      {highlights.map((item) => (
        <article
          key={item.title}
          className="group rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <item.icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
        </article>
      ))}
    </section>
  );
}

