// src/features/team/api/types.ts
// Team feature DTOs and API helpers

import type {
  CompanyRoleName,
  ProjectRoleName,
  MemberStatus,
} from "@/types/common/rbac";

// Standardní stránkovaná odpověď (FE kontrakt)
export { type PageResponse } from "@/types/PageResponse";

export type { CompanyRoleName };

// --- Primitives & aliases ---
export type UUID = string;
export type ISODateString = string; // ISO-8601 string (e.g. 2025-09-29T08:15:30Z)

// --- Project role assignment ---
export type ProjectRoleAssignmentDto = {
  projectId: UUID;
  role: ProjectRoleName;
};

// --- Members ---

/**
 * Lehká varianta pro list.
 * UI si full name skládá samo z firstName/lastName; displayName je volitelný precomputed label.
 * Pozn.: Některé payloady mohou používat `companyRole` místo `role` → držíme obě pro kompatibilitu.
 */
export type MemberSummaryDto = {
  id: UUID;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  /** Primárně očekáváme `role`; `companyRole` necháváme jako alias pro přechodové payloady. */
  role?: CompanyRoleName | null;
  companyRole?: CompanyRoleName | null;
  phone?: string | null;
  displayName?: string;
  /** Volitelně, pokud BE začne posílat i stav do summary. */
  status?: MemberStatus | (string & {});
  /** Volitelně: některé payloady mohou posílat userId zvlášť. */
  userId?: UUID | null;
};

/**
 * Plný profil člena – **normalized** tvar po klientské normalizaci.
 * Primární je `role`; `companyRole` je volitelný alias (pro starší/alternativní payloady).
 */
export interface MemberDto {
  /** Normalizované ID (může pocházet z memberId/userId/raw id). */
  id: UUID;
  email: string;

  /** Company role z BE (RBAC na úrovni firmy) – primární pole. */
  role: CompanyRoleName;
  /** Volitelný alias (přechodové payloady). */
  companyRole?: CompanyRoleName | null;

  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;

  /** Volitelný precomputed label (pokud ho BE dodává). */
  displayName?: string;

  /**
   * Stav účtu/člena – BE může posílat různé enumy; buď náš MemberStatus,
   * nebo jiný string. Proto ponecháváme tolerantní typ.
   */
  status?: MemberStatus | (string & {});

  /** Volitelně: BE může posílat i userId (nezaměňovat s id). */
  userId?: UUID | null;

  createdAt?: ISODateString | null;
  updatedAt?: ISODateString | null;
}

// --- Requests ---

/**
 * CreateMemberRequest – přesně dle BE kontraktu:
 *   email (required), role (required), firstName/lastName/phone (optional).
 */
export type CreateMemberRequest = {
  email: string;
  role: CompanyRoleName;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

/**
 * UpdateMemberRequest – širší „admin“ request (pokud ho máš někde použitý).
 * Pro úpravu profilu používej raději UpdateMemberProfileRequest.
 */
export type UpdateMemberRequest = {
  companyRole?: CompanyRoleName | null;
  projectRolesReplace?: ProjectRoleAssignmentDto[] | null; // idempotent
};

/**
 * UpdateMemberProfileRequest – pouze profilová data (bez role).
 * Pokud někde upravuješ roli, používej UpdateMemberRoleRequest.
 */
export type UpdateMemberProfileRequest = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export interface UpdateMemberRoleRequest {
  role: CompanyRoleName;
}

// --- Members stats DTO (BE: GET /tenants/{companyId}/members/stats) ---
export type MembersStatsDto = {
  owners: number;
  active?: number;
  invited?: number;
  disabled?: number;
  total?: number;
};
