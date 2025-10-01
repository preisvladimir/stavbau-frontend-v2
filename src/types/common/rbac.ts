/** FE role do UI formulářů (mimo BE company role) */
export type TeamRole = 'ADMIN' | 'MEMBER';

/** deprecated... Company role vracená BE (rozšířitelná o string pro forward-compat) */
export type CompanyRole =
  | 'OWNER'
  | 'COMPANY_ADMIN'
  | 'ACCOUNTANT'
  | 'PURCHASING'
  | 'MANAGER'
  | 'DOC_CONTROLLER'
  | 'FLEET_MANAGER'
  | 'HR_MANAGER'
  | 'AUDITOR_READONLY'
  | 'INTEGRATION'
  | 'MEMBER'
  | 'VIEWER'
  | 'SUPERADMIN'
  | string;

// --- RBAC enums (mirror of BE) - (rozšířitelná o string pro forward-compat) ---
export type CompanyRoleName =
  | 'OWNER'
  | 'COMPANY_ADMIN'
  | 'ACCOUNTANT'
  | 'PURCHASING'
  | 'DOC_CONTROLLER'
  | 'FLEET_MANAGER'
  | 'HR_MANAGER'
  | 'AUDITOR_READONLY'
  | 'INTEGRATION'
  | 'MEMBER'
  | 'VIEWER'
  | 'SUPERADMIN'
  | string;

export const ROLE_WHITELIST: readonly CompanyRoleName[] = [
  'OWNER',
  'COMPANY_ADMIN',
  'ACCOUNTANT',
  'PURCHASING',
  'MANAGER' as any, // pokud BE roli používá, necháme tolerantní; jinak odstraňte
  'DOC_CONTROLLER',
  'FLEET_MANAGER',
  'HR_MANAGER',
  'AUDITOR_READONLY',
  'INTEGRATION',
  'MEMBER' as any, // viz poznámka výše
  'VIEWER',
  'SUPERADMIN',
] as const;

const HIDDEN = new Set<CompanyRoleName>(['OWNER', 'SUPERADMIN']);
export const VISIBLE_ROLES: ReadonlyArray<CompanyRoleName> =
  ROLE_WHITELIST.filter(r => !HIDDEN.has(r));

export type MemberStatus =
  | 'CREATED'
  | 'ACTIVE'
  | 'INVITED'
  | 'DISABLED'
  | 'REMOVED';

export type ProjectRoleName =
  | 'PROJECT_MANAGER'
  | 'SITE_MANAGER'
  | 'FOREMAN'
  | 'QS'
  | 'HSE'
  | 'DESIGNER'
  | 'SUBCONTRACTOR'
  | 'CLIENT'
  | 'PROJECT_VIEWER';