import * as React from "react";

export const EmptyState: React.FC<{ title: string; description?: string; action?: React.ReactNode }> = ({ title, description, action }) => (
  <div className="text-center py-8">
    <div className="text-base font-medium">{title}</div>
    {description ? <div className="mt-1 text-sm text-[rgb(var(--sb-muted))]">{description}</div> : null}
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
);
