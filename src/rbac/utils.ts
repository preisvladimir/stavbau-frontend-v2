// src/features/auth/rbac/utils.ts
import type { Scope, Area, Action } from './catalog';

export function isScope(value: string): value is Scope {
  return value.includes(':') && value.split(':').length === 2;
}

// Normalizace na "area:action" (pro jistotu – ořeže mezery, lowercase)
export function normalizeScope(value: string): Scope {
  const [a, b] = value.trim().toLowerCase().split(':');
  return `${a as Area}:${b as Action}`;
}
