/** FE role do UI formulářů (mimo BE company role) */
export type TeamRole = 'ADMIN' | 'MEMBER';

/** Company role vracená BE (rozšířitelná o string pro forward-compat) */
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

export type MemberStatus =
  | 'CREATED'
  | 'ACTIVE'
  | 'INVITED'
  | 'DISABLED'
  | 'REMOVED';