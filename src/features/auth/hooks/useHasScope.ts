// src/features/auth/hooks/useHasScope.ts
import { useAuth } from '@/features/auth/hooks/useAuth'; // uprav cestu podle projektu

type Mode = 'anyOf' | 'allOf';

// Overloady
export function useHasScope(userScopes: string[], required: string | string[], mode?: Mode): boolean;
export function useHasScope(required: string | string[], mode?: Mode): boolean;

// Implementace obou variant
export function useHasScope(arg1: string[] | string | string[], arg2?: string | string[] | Mode, arg3?: Mode): boolean {
  // Rozliš: [userScopes, required, mode]  vs.  [required, mode]
  if (Array.isArray(arg1) && Array.isArray(arg2) || (Array.isArray(arg1) && typeof arg2 === 'string')) {
    const userScopes = arg1 as string[];
    const required = Array.isArray(arg2) ? arg2 : [arg2 as string];
    const mode = (arg3 ?? 'anyOf') as Mode;
    return mode === 'allOf'
      ? required.every((s) => userScopes.includes(s))
      : required.some((s) => userScopes.includes(s));
  }

  // Hook varianta – vyzvedne scopes z auth
  const required = Array.isArray(arg1) ? arg1 : [arg1 as string];
  const mode = (arg2 as Mode | undefined) ?? 'anyOf';
  const { user } = useAuth();
  const userScopes = user?.scopes ?? [];
  return mode === 'allOf'
    ? required.every((s) => userScopes.includes(s))
    : required.some((s) => userScopes.includes(s));
}
