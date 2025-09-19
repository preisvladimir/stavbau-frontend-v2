/** DTO typy – držet v sync s BE. TODO: potvrdit přes Swagger/OpenAPI */
export type LoginRequest = { email: string; password: string; };
export type LoginResponse = { accessToken: string; refreshToken: string; expiresAt: string; };
export type RefreshRequest = { refreshToken: string; };
export type RefreshResponse = { accessToken: string; refreshToken: string; expiresAt: string; };
export type MeResponse = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  activeCompany?: { id: string; name: string } | null;
  role: string;
  scopes: string[];
};
export type PageResponse<T> = { items: T[]; page: number; size: number; total: number; };

export type AddressDto = { street: string; city: string; zip: string; country: string };

// ARES response (zjednodušené podle BE)
export type CompanyLookupPreviewDto = {
  ico: string;
  dic?: string | null;
  name: string;
  legalFormCode?: string | null;
  legalFormName?: string | null;
  address: AddressDto;
};

// Request pro registraci
export type CompanyRegistrationRequest = {
  company: {
    ico: string;
    dic?: string | null;
    name: string;
    address: { street: string; city: string; zip: string; country: string };
    legalFormCode?: string | null;
  };
  owner: {
    email: string;
    password: string;
    firstName?: string | null; // MVP neperzistujeme, ale necháme v DTO
    lastName?: string | null;
    phone?: string | null;
  };
  consents: { termsAccepted: boolean; marketing?: boolean | null };
};

export type CompanyRegistrationResponse = {
  companyId: string;
  ownerUserId: string;
  ownerRole: 'OWNER';
  status: 'CREATED' | 'EXISTS' | 'PENDING_VERIFICATION';
};

// ProblemDetail (BE sjednoceno)
export type ProblemDetail = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  code?: string; // např. 'company.exists', 'user.email.exists', 'validation.error'
  path?: string;
  [k: string]: unknown;  
};

// =========================================
// Team (Company Members)
// =========================================

/** FE role do UI formulářů (mimo BE company role) */
export type TeamRole = 'ADMIN' | 'MEMBER';

/** Company role vracená BE (rozšířitelná o string pro forward-compat) */
export type CompanyRole =
  | 'OWNER'
  | 'COMPANY_ADMIN'
  | 'MANAGER'
  | 'EDITOR'
  | 'VIEWER'
  | string;

export interface MemberDto {
  id: string;
  email: string;
  /** Company role z BE (RBAC na úrovni firmy) */
  role: CompanyRole;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
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