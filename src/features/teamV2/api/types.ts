// Team feature DTOs and API helpers
import type {
    CompanyRoleName,
    ProjectRoleName,
    MemberStatus,
} from "@/types/common/rbac";

// --- Primitives & aliases ---
export type UUID = string;
export type ISODateString = string; // ISO-8601 string (e.g. 2025-09-29T08:15:30Z)

export type ProjectRoleAssignmentDto = {
  projectId: UUID;
  role: ProjectRoleName;
};

// --- Members ---
// Lehčí varianta pro list (pokud ji BE někdy poskytne). UI nepředpokládá displayName – skládá si ho samo.
export type MemberSummaryDto = {
  id: UUID;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: CompanyRoleName | null; // alias/fallback k role
  companyRole?: CompanyRoleName | null; // alias/fallback k role
  phone?: string | null;
  displayName?: string; // volitelný precomputed label, pokud by BE posílal
};

// Plný profil člena – konzistentní s mapováním v api/client.ts::normalizeOne
export interface MemberDto {
  id: string;
  email: string;
  /** Company role z BE (RBAC na úrovni firmy) – primární pole */
  role: CompanyRoleName;
  /** Volitelný alias (přechodové payloady) */
  companyRole?: CompanyRoleName | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status: MemberStatus;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

// --- Requests ---
export type CreateMemberRequest = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  companyRole?: CompanyRoleName | null;
  role?: CompanyRoleName | null;
  initialProjectRoles?: ProjectRoleAssignmentDto[] | null;
  sendInvite?: boolean; // default true
};

export type UpdateMemberRequest = {
  companyRole?: CompanyRoleName | null;
  projectRolesReplace?: ProjectRoleAssignmentDto[] | null; // idempotent
};

// + nový typ jen pro profil
export type UpdateMemberProfileRequest = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  // email schválně ne – většinou se neupravuje v profilu
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