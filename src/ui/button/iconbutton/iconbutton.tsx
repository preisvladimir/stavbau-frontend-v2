import * as React from "react";
import { cn } from "@/lib/utils/cn"; // tvůj helper na classNames, pokud máte

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  "aria-label": string; // a11y povinné
};

export function IconButton({ className, children, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/50 disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}