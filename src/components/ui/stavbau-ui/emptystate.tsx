import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, description, action, icon, className }) => (
  <div className={cn("text-center py-8 px-4", className)} role="status" aria-live="polite">
    {icon ? <div className="mb-2 flex justify-center">{icon}</div> : null}
    <div className="text-base font-medium">{title}</div>
    {description ? (
      <div className="mt-1 text-sm text-[rgb(var(--sb-muted))]">{description}</div>
    ) : null}
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
);
