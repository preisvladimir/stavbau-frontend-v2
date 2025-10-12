// src/features/team/mappers/TeamMappers.ts
import type {
  CreateMemberRequest,
  UpdateMemberRequest,
  UpdateMemberRoleRequest,
  UpdateMemberProfileRequest,
  CompanyRoleName,
} from '../api/types';
import type { AnyTeamFormValues } from '../validation/schemas';

// --- Name helper usable with both legacy and v2 DTOs ---
export function memberDisplayName(m: any): string {
  const dn = m?.displayName?.trim?.();
  if (dn) return dn;
  const first = (m?.firstName ?? '').trim();
  const last = (m?.lastName ?? '').trim();
  const composed = [first, last].filter(Boolean).join(' ').trim();
  return composed || m?.email || '—';
}

const emptyToNull = (v: unknown) => {
  if (typeof v !== 'string') return (v ?? null) as any;
  const s = v.trim();
  return (s.length ? s : null) as any;
};

// CREATE: pošli přesně to, co bere BE
export function formToCreateBody(values: AnyTeamFormValues): CreateMemberRequest {
  const role = (values.companyRole ?? values.role ?? 'MEMBER') as CompanyRoleName;
  return {
    email: values.email.trim(),
    role,
    firstName: emptyToNull(values.firstName),
    lastName:  emptyToNull(values.lastName),
    phone:     emptyToNull(values.phone),
  };
}

// EDIT (profil) – pouze profilová pole (žádná role!)
export function formToUpdateProfileBody(values: AnyTeamFormValues): UpdateMemberProfileRequest {
  return {
    firstName: emptyToNull(values.firstName),
    lastName:  emptyToNull(values.lastName),
    phone:     emptyToNull(values.phone),
  };
}

// Role-only update (vrátí null, pokud není co měnit)
export function formToUpdateRoleBody(v: any): UpdateMemberRoleRequest | null {
  const role = (v?.companyRole ?? v?.role ?? null) as CompanyRoleName | null;
  return role ? { role } : null;
}

/**
 * Širší admin update (pokud ho někde používáš).
 * Pro profil používej `formToUpdateProfileBody`,
 * pro roli `formToUpdateRoleBody`.
 */
export function formToUpdateBody(v: any): UpdateMemberRequest {
  return {
    companyRole: (v?.companyRole ?? null) as CompanyRoleName | null,
    projectRolesReplace: Array.isArray(v?.projectRoles) ? v.projectRoles : null,
  };
}
