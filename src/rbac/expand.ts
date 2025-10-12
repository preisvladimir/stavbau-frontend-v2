// src/features/auth/rbac/expand.ts
import { META_EXPANSION, type RoleRef, roles, type Scope } from './catalog';

// zjistí, zda string vypadá jako RoleRef "area.role"
const isRoleRef = (v: string): v is RoleRef => v.includes('.') && !v.includes(':');

// najde set Scope pro RoleRef
export function expandRole(role: RoleRef): ReadonlySet<Scope> {
  const [area, roleName] = role.split('.');
  // @ts-expect-error – runtime lookup (typy držíme přes ROLE_KEYS, tohle je ochrana)
  const areaRoles = roles[area];
  if (!areaRoles) return new Set();
  const set = areaRoles[roleName];
  return set ?? new Set();
}

// expandne meta-scop(y) na jemné scopy, pokud existuje expanze
export function expandMeta(scope: Scope): ReadonlySet<Scope> {
  return META_EXPANSION[scope] ?? new Set([scope]);
}

// Hlavní API: vezmi mix Scope[] a RoleRef[] → vrať deduplikované jemné scopy
export function expandScopes(input: Array<Scope | RoleRef>): Scope[] {
  const out = new Set<Scope>();
  for (const item of input) {
    if (isRoleRef(item)) {
      expandRole(item).forEach(s => expandMeta(s).forEach(ss => out.add(ss)));
    } else {
      // je to Scope – expanduj případnou meta-úroveň
      expandMeta(item).forEach(ss => out.add(ss));
    }
  }
  return [...out];
}
