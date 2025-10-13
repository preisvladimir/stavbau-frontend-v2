// src/features/auth/rbac/index.ts
// Jediný vstupní bod pro RBAC ve FE
export * from './catalog';        // sc, s, typy, ROLE_KEYS, roles, …
// volitelné — pokud používáš
export * from './expand';
export * from './hooks';

export { default as ScopeGuard } from './ScopeGuard';

export * from './useRoleOptions';

