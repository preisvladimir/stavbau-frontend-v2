// FILE: src/components/ui/Badge.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition",
  {
    variants: {
      intent: {
        neutral:
          "bg-[rgba(var(--sb-border)/0.6)] text-[rgb(var(--sb-muted))] ring-[rgba(var(--sb-border)/0.6)]",
        success:
          "bg-[rgba(34,197,94,.1)] text-[rgb(var(--sb-success))] ring-[rgba(34,197,94,.2)]",
        info: "bg-[rgba(59,130,246,.12)] text-[rgb(var(--sb-info))] ring-[rgba(59,130,246,.2)]",
        warning:
          "bg-[rgba(245,158,11,.14)] text-[rgb(var(--sb-warning))] ring-[rgba(245,158,11,.2)]",
        danger:
          "bg-[rgba(239,68,68,.12)] text-[rgb(var(--sb-danger))] ring-[rgba(239,68,68,.2)]",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
      dot: {
        true: "pl-1.5",
      },
    },
    defaultVariants: {
      intent: "neutral",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Badge – univerzální štítek pro stavy, tagy a statusy.
 * - Variants: intent (neutral, success, info, warning, danger)
 * - Size: sm, md, lg
 * - Přístupnost: role="status", aria-label doporučeno
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      intent,
      size,
      dot,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        role="status"
        className={cn(badgeVariants({ intent, size, dot }), className)}
        {...props}
      >
        {dot ? <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" /> : null}
        {leftIcon ? <span className="mr-1 inline-flex">{leftIcon}</span> : null}
        <span>{children}</span>
        {rightIcon ? <span className="ml-1 inline-flex">{rightIcon}</span> : null}
      </span>
    );
  }
);

Badge.displayName = "Badge";
