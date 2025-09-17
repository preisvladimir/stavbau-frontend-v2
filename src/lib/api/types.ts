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
export type AresCompanyDto = {
  ico: string;
  dic?: string | null;
  name: string;
  legalFormCode?: string | null;
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