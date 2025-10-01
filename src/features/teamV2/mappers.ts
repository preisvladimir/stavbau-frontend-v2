import type {
  CreateMemberRequest,
  UpdateMemberRequest,
  UpdateMemberProfileRequest,
  UpdateMemberRoleRequest,
} from './api/types';
import type { CompanyRoleName } from "@/types/common/rbac";

// --- Name helper usable with both legacy and v2 DTOs ---
export function memberDisplayName(m: any): string {
  const dn = m?.displayName?.trim?.();
  if (dn) return dn;
  const first = (m?.firstName ?? '').trim();
  const last = (m?.lastName ?? '').trim();
  const composed = [first, last].filter(Boolean).join(' ').trim();
  return composed || m?.email || '—';
}

// Create
export function formToCreateBody(v: any): CreateMemberRequest {
  return {
    email: v.email?.trim(),
    role: v.companyRole ?? v.role ?? null,
    initialProjectRoles: Array.isArray(v.projectRoles) ? v.projectRoles : undefined,
    sendInvite: v.sendInvite ?? true,
  };
}

// Profile-only update (NE role)
export function formToUpdateProfileBody(v: any): UpdateMemberProfileRequest {
  return {
    firstName: v.firstName?.trim() || undefined,
    lastName: v.lastName?.trim() || undefined,
    phone: v.phone?.trim() || undefined,
    // email z principu neupravujeme; pokud by bylo třeba, doplníme zde
  };
}


// Role-only update
export function formToUpdateRoleBody(v: any): UpdateMemberRoleRequest | null {
  const role = (v.companyRole ?? v.role ?? null) as CompanyRoleName | null;
  return role ? { role } : null;
}

export function formToUpdateBody(v: any): UpdateMemberRequest {
  return {
    companyRole: v.companyRole ?? null,
    projectRolesReplace: Array.isArray(v.projectRoles) ? v.projectRoles : null,
  };
}