// src/features/auth/rbac/ScopeGuard.tsx
import * as React from 'react';
import type { Scope, RoleRef } from './catalog';
import { useHasAny, useHasAll } from './hooks';

type Props = {
  anyOf?: Array<Scope | RoleRef>;
  allOf?: Array<Scope | RoleRef>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export default function ScopeGuard({ anyOf, allOf, fallback = null, children }: Props) {
  const okAny = anyOf ? useHasAny(anyOf) : true;
  const okAll = allOf ? useHasAll(allOf) : true;
  return okAny && okAll ? <>{children}</> : <>{fallback}</>;
}
