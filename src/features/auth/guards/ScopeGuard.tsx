import React from "react";
import { hasScope } from "../utils/hasScope";
import { useAuthContext } from "../context/AuthContext";

/** TODO: props anyOf/allOf, fallback */

export default function ScopeGuard({
  required,
  children,
  fallback = null,
}: {
  required: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useAuthContext();
  const allowed = hasScope((user as any)?.scopes ?? [], required);
  return <>{allowed ? children : fallback}</>;
}