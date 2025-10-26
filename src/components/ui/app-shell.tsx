import * as React from "react";

import { cn } from "@/lib/utils";

interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("min-h-screen bg-muted/40 text-foreground", className)}
      {...props}
    />
  )
);
AppShell.displayName = "AppShell";

interface AppShellHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AppShellHeader = React.forwardRef<HTMLDivElement, AppShellHeaderProps>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-20 w-full border-b border-border/80 bg-background/80 backdrop-blur",
        className
      )}
      {...props}
    />
  )
);
AppShellHeader.displayName = "AppShellHeader";

interface AppShellSidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AppShellSidebar = React.forwardRef<HTMLDivElement, AppShellSidebarProps>(
  ({ className, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        "hidden w-full max-w-xs flex-col gap-4 border-r border-border/70 bg-card/60 p-6 backdrop-blur-lg md:flex",
        className
      )}
      {...props}
    />
  )
);
AppShellSidebar.displayName = "AppShellSidebar";

interface AppShellMainProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AppShellMain = React.forwardRef<HTMLDivElement, AppShellMainProps>(
  ({ className, ...props }, ref) => (
    <main
      ref={ref}
      className={cn(
        "flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 lg:px-12",
        className
      )}
      {...props}
    />
  )
);
AppShellMain.displayName = "AppShellMain";

