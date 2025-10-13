// src/rbac/hooks.ts
import * as React from 'react';
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Scope, RoleRef } from './catalog';
import { expandScopes } from './expand';

// Pomocný hash pro stabilnější deps (stačí lehký join; scopy jsou krátké řetězce)
const hashReq = (arr: ReadonlyArray<Scope | RoleRef>) => arr.join('|');

export function useHasAny(input: ReadonlyArray<Scope | RoleRef>): boolean {
  const { user } = useAuth();

  // Expanduj jen když se změní vstup nebo scopes uživatele
  const expanded = React.useMemo(() => {
    // pokud expandScopes očekává mutable pole, uděláme kopii
    return new Set(expandScopes([...input]));
  }, [hashReq(input)]);

  return React.useMemo(() => {
    const userScopes = user?.scopes ?? [];
    // srovnáváme proti jemným scopům (expanded)
    return userScopes.some(s => expanded.has(s as Scope));
  }, [user?.scopes, expanded]);
}

export function useHasAll(input: ReadonlyArray<Scope | RoleRef>): boolean {
  const { user } = useAuth();

  const expanded = React.useMemo(() => {
    return new Set(expandScopes([...input]));
  }, [hashReq(input)]);

  return React.useMemo(() => {
    const have = new Set(user?.scopes ?? []);
    for (const s of expanded) {
      if (!have.has(s)) return false;
    }
    return true;
  }, [user?.scopes, expanded]);
}
