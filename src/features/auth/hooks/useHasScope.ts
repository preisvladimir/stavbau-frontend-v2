/**
 * @deprecated Použij raději `useHasAny` / `useHasAll` z `@/rbac`.
 * Tento hook je dočasný shim, který deleguje na nový RBAC single-source.
 */
import * as React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth'; // zdroj user.scopes
import { expandScopes } from '@/rbac/expand';
import type { Scope, RoleRef } from '@/rbac';

type Mode = 'anyOf' | 'allOf';

// Pomocný „loose“ wrapper: přijme stringy a předá je expandéru
function expandLoose(input: Array<string | Scope | RoleRef>): Scope[] {
  return expandScopes(input as unknown as Array<Scope | RoleRef>);
}

// Overloady – zachovány kvůli zpětné kompatibilitě
export function useHasScope(userScopes: string[], required: string | string[], mode?: Mode): boolean;
export function useHasScope(required: string | string[], mode?: Mode): boolean;


// Implementace obou variant s delegací na nový RBAC
export function useHasScope(
  arg1: string[] | string | string[] | Array<Scope | RoleRef>,
  arg2?: string | string[] | Array<Scope | RoleRef> | Mode,
  arg3?: Mode
): boolean {
  // Varianta A: (userScopes, required, mode)
  const isVariantA =
    Array.isArray(arg1) &&
    (Array.isArray(arg2) || typeof arg2 === 'string');

  if (isVariantA) {
    const userScopes = arg1 as string[];
    const requiredRaw = (Array.isArray(arg2) ? arg2 : [arg2 as string]) as Array<string | Scope | RoleRef>;
    const mode = (arg3 ?? 'anyOf') as Mode;

    // Rozbal meta-scopy a role → jemné scopy
     const required = expandLoose(requiredRaw);
    if (mode === 'allOf') return required.every((s) => userScopes.includes(s));
    return required.some((s) => userScopes.includes(s));
  }

  // Varianta B: (required, mode) – userScopes z Auth
  const requiredRaw = (Array.isArray(arg1) ? arg1 : [arg1 as string]) as Array<string | Scope | RoleRef>;
  const mode = (arg2 as Mode | undefined) ?? 'anyOf';
  const { user } = useAuth();
  const have = React.useMemo(() => new Set(user?.scopes ?? []), [user?.scopes]);
  const required = React.useMemo(() => new Set(expandLoose(requiredRaw)), [requiredRaw]);

  if (mode === 'allOf') {
    for (const s of required) if (!have.has(s)) return false;
    return true;
  }
  // anyOf
  for (const s of required) if (have.has(s)) return true;
  return false;
}