import * as React from "react";
import clsx from "clsx";

type Intent = "neutral" | "success" | "info" | "warning" | "danger";

const map = {
  neutral: "bg-[rgba(var(--sb-border))] text-[rgb(var(--sb-muted))]",
  success: "bg-[rgba(34,197,94,.1)] text-[rgb(var(--sb-success))]",
  info:    "bg-[rgba(59,130,246,.12)] text-[rgb(var(--sb-info))]",
  warning: "bg-[rgba(245,158,11,.14)] text-[rgb(var(--sb-warning))]",
  danger:  "bg-[rgba(239,68,68,.12)] text-[rgb(var(--sb-danger))]",
};

export const Badge: React.FC<{ intent?: Intent; dot?: boolean; className?: string; children: React.ReactNode; }> = ({ intent="neutral", dot, className, children }) => (
  <span className={clsx("sb-badge", map[intent], className)}>
    {dot ? <span className="sb-badge--dot" /> : null}
    {children}
  </span>
);
