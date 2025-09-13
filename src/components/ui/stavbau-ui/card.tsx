import * as React from "react";
import clsx from "clsx";

export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("sb-card", className)} {...p} />
);

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("p-4 border-b border-[rgb(var(--sb-border))]", className)} {...p} />
);
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={clsx("text-base font-semibold", className)} {...p} />
);
export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={clsx("text-sm text-[rgb(var(--sb-muted))] mt-1", className)} {...p} />
);
export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("p-4", className)} {...p} />
);
