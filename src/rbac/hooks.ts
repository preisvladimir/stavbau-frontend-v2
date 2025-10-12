// src/rbac/hooks.ts
import * as React from 'react';
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Scope, RoleRef } from './catalog';
import { expandScopes } from './expand';

export function useHasAny(input: Array<Scope | RoleRef>): boolean {
  const { user } = useAuth();
  return React.useMemo(() => {
    const expanded = new Set(expandScopes(input)); // jemné scopy
    return [...(user?.scopes ?? [])].some(s => expanded.has(s as Scope));
  }, [user?.scopes, input]);
}

export function useHasAll(input: Array<Scope | RoleRef>): boolean {
  const { user } = useAuth();
  return React.useMemo(() => {
    const expanded = new Set(expandScopes(input));
    const have = new Set(user?.scopes ?? []);
    for (const s of expanded) if (!have.has(s)) return false;
    return true;
  }, [user?.scopes, input]);
}
