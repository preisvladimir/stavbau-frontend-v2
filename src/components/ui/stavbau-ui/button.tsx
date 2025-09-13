import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

const buttonVariants = cva(
  "sb-btn focus-visible:outline-none transition active:translate-y-[1px]",
  {
    variants: {
      variant: {
        primary: "sb-btn--primary",
        outline: "sb-btn--outline",
        danger: "sb-btn--danger",
        ghost: "bg-transparent text-[rgb(var(--sb-fg))] hover:bg-[rgba(var(--sb-border)/0.3)]",
      },
      size: {
        sm: "h-9 text-sm px-3",
        md: "h-11 text-sm px-4",
        lg: "h-12 text-base px-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, leftIcon, rightIcon, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {leftIcon ? <span className="mr-2 inline-flex">{leftIcon}</span> : null}
      {isLoading ? <span className="mr-2 inline-flex animate-spin">⏳</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="ml-2 inline-flex">{rightIcon}</span> : null}
    </button>
  )
);
Button.displayName = "Button";
