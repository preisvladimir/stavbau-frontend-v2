import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Loading: React.FC<{
  label?: string;
  className?: string;
}> = ({ label = "Načítám…", className }) => (
  <div
    className={cn("flex items-center justify-center py-8 px-4 gap-3", className)}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[rgb(var(--sb-muted))] border-t-[rgb(var(--sb-foreground,0,0,0))]"
      aria-hidden="true"
    />
    <span className="text-sm text-[rgb(var(--sb-muted))]">{label}</span>
  </div>
);