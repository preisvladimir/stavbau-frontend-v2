import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title = "Došlo k chybě", description, action, icon, className }) => (
  <div
    className={cn("text-center py-8 px-4", className)}
    role="alert"
    aria-live="assertive"
  >
    {icon ? <div className="mb-2 flex justify-center">{icon}</div> : null}
    <div className="text-base font-medium text-[rgb(var(--sb-danger,255,76,76))]">
      {title}
    </div>
    {description ? (
      <div className="mt-1 text-sm text-[rgb(var(--sb-muted))]">{description}</div>
    ) : null}
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
);