// --- TabButton.tsx ---
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

// Varianty: aktivní = primary, jinak outline
const tabButtonVariants = cva(
  "h-8 rounded-xl px-3 text-sm font-medium transition-colors",
  {
    variants: {
      active: {
        true: "bg-emerald-500 text-white",
        false: "border border-[rgb(var(--sb-border))] bg-white text-slate-800 hover:bg-slate-50",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface TabButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabButtonVariants> {}

export const TabButton = React.forwardRef<HTMLButtonElement, TabButtonProps>(
  ({ className, active, ...props }, ref) => (
    <button ref={ref} className={clsx(tabButtonVariants({ active }), className)} {...props} />
  )
);

TabButton.displayName = "TabButton";
