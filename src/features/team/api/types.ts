import type {
  CompanyRole,
  MemberStatus,
} from "@/types/common/rbac";

export interface MemberDto {
  id: string;
  email: string;
  /** Company role z BE (RBAC na úrovni firmy) */
  role: CompanyRole;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status: MemberStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Pokud BE vrací objekt s položkami, použijeme tento tvar; pro skeleton načítáme pole MemberDto[] */
export interface MemberListResponse {
  items: MemberDto[];
  total?: number;
}

export interface CreateMemberRequest {
  email: string;
  /** Požadovaná company role (FE může poslat konkrétní string pro BE) */
  role: CompanyRole | string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export interface UpdateMemberRequest {
  role?: CompanyRole | string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export interface UpdateMemberRoleRequest {
  role: CompanyRole;
}