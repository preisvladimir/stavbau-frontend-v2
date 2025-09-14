import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const cardVariants = cva(
  "sb-card rounded-xl border border-[rgb(var(--sb-border))] bg-white shadow-sm " +
    "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[rgb(var(--sb-border))]",
  {
    variants: {
      variant: {
        default: "",
        ghost: "border-transparent shadow-none bg-transparent",
        outlined: "bg-transparent shadow-none",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
      },
    },
    defaultVariants: { variant: "default", shadow: "sm" },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, shadow, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, shadow }), className)} {...props} />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-4 border-b border-[rgb(var(--sb-border))] flex flex-col gap-1.5",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-base font-semibold leading-none", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-[rgb(var(--sb-muted))]", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

/** Akční patička karty – pravolevý layout, sticky volitelně pro formuláře/modal */
export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sticky?: boolean }
>(({ className, sticky, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-4 border-t border-[rgb(var(--sb-border))] flex items-center justify-end gap-2",
      sticky && "sticky bottom-0 bg-white",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
