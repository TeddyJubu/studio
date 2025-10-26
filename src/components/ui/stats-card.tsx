import * as React from "react";

import { cn } from "@/lib/utils";

interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  helper?: string;
  trendLabel?: string;
  trend?: "up" | "down" | "flat";
}

const trendClassMap: Record<NonNullable<StatsCardProps["trend"]>, string> = {
  up: "text-success",
  down: "text-destructive",
  flat: "text-muted-foreground",
};

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ label, value, helper, trend, trendLabel, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-3xl font-semibold text-foreground">{value}</span>
        {trend && trendLabel ? (
          <span className={cn("text-xs font-medium", trendClassMap[trend])}>{trendLabel}</span>
        ) : null}
      </div>
      {helper ? <p className="mt-1 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  )
);
StatsCard.displayName = "StatsCard";

