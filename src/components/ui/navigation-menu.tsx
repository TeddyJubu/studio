"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";

import { cn } from "@/lib/utils";

type NavigationMenuProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>;
type NavigationMenuRef = React.ElementRef<typeof NavigationMenuPrimitive.Root>;

const NavigationMenu = React.forwardRef<NavigationMenuRef, NavigationMenuProps>(
  ({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Root
      ref={ref}
      className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    />
  )
);
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

type NavigationMenuListProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>;
type NavigationMenuListRef = React.ElementRef<typeof NavigationMenuPrimitive.List>;

const NavigationMenuList = React.forwardRef<NavigationMenuListRef, NavigationMenuListProps>(
  ({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.List
      ref={ref}
      className={cn(
        "group flex w-max flex-row items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1 shadow-sm backdrop-blur",
        className
      )}
      {...props}
    />
  )
);
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

type NavigationMenuTriggerProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>;
type NavigationMenuTriggerRef = React.ElementRef<typeof NavigationMenuPrimitive.Trigger>;

const NavigationMenuTrigger = React.forwardRef<NavigationMenuTriggerRef, NavigationMenuTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={cn(
        "group inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
);
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

type NavigationMenuContentProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>;
type NavigationMenuContentRef = React.ElementRef<typeof NavigationMenuPrimitive.Content>;

const NavigationMenuContent = React.forwardRef<NavigationMenuContentRef, NavigationMenuContentProps>(
  ({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Content
      ref={ref}
      className={cn(
        "data-[motion=from-start]:animate-enter-from-left data-[motion=from-end]:animate-enter-from-right data-[motion=to-start]:animate-exit-to-left data-[motion=to-end]:animate-exit-to-right top-0 left-0 w-full sm:absolute sm:w-auto",
        className
      )}
      {...props}
    />
  )
);
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

type NavigationMenuLinkProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>;
type NavigationMenuLinkRef = React.ElementRef<typeof NavigationMenuPrimitive.Link>;

const NavigationMenuLink = React.forwardRef<NavigationMenuLinkRef, NavigationMenuLinkProps>(
  ({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Link
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  )
);
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName;

type NavigationMenuIndicatorProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>;
type NavigationMenuIndicatorRef = React.ElementRef<typeof NavigationMenuPrimitive.Indicator>;

const NavigationMenuIndicator = React.forwardRef<NavigationMenuIndicatorRef, NavigationMenuIndicatorProps>(
  ({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Indicator
      ref={ref}
      className={cn("top-full z-20 flex h-2 items-end justify-center overflow-hidden", className)}
      {...props}
    >
      <span className="h-2 w-2 rotate-45 rounded-tl-sm bg-border" />
    </NavigationMenuPrimitive.Indicator>
  )
);
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

type NavigationMenuViewportProps = React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>;
type NavigationMenuViewportRef = React.ElementRef<typeof NavigationMenuPrimitive.Viewport>;

const NavigationMenuViewport = React.forwardRef<NavigationMenuViewportRef, NavigationMenuViewportProps>(
  ({ className, ...props }, ref) => (
    <div className="absolute left-0 top-full flex w-full justify-center">
      <NavigationMenuPrimitive.Viewport
        ref={ref}
        className={cn(
          "origin-top-center rounded-3xl border border-border bg-popover p-4 text-foreground shadow-lg transition-[width,height] data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in",
          className
        )}
        {...props}
      />
    </div>
  )
);
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};

