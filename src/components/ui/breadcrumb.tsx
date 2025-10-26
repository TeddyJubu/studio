import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const Breadcrumb = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"nav">>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn("flex flex-wrap items-center gap-1 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb"
      {...props}
    />
  )
);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn("flex flex-wrap items-center gap-1", className)}
      {...props}
    />
  )
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center gap-1", className)} {...props} />
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(
  ({ className, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "rounded-md px-1 py-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
      {...props}
    />
  )
);
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("rounded-md px-1 py-0.5 text-sm font-semibold text-foreground", className)}
      {...props}
    />
  )
);
BreadcrumbPage.displayName = "BreadcrumbPage";

type BreadcrumbSeparatorProps = React.ComponentPropsWithoutRef<"span">;

const BreadcrumbSeparator = ({ className, ...props }: BreadcrumbSeparatorProps) => (
  <span
    role="presentation"
    className={cn("flex h-3 w-3 items-center justify-center text-muted-foreground", className)}
    {...props}
  >
    <ChevronRight className="h-3 w-3" aria-hidden="true" />
  </span>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

type BreadcrumbEllipsisProps = React.ComponentPropsWithoutRef<"span">;

const BreadcrumbEllipsis = ({ className, ...props }: BreadcrumbEllipsisProps) => (
  <span
    className={cn("flex h-3 w-3 items-center justify-center text-muted-foreground", className)}
    {...props}
  >
    ...
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
