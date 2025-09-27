export type LoginRequest = { email: string; password: string; };
export type LoginResponse = { accessToken: string; refreshToken: string; expiresAt: string; };
export type RefreshRequest = { refreshToken: string; };
export type RefreshResponse = { accessToken: string; refreshToken: string; expiresAt: string; };
export type MeResponse = {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  activeCompany?: { id: string; name: string } | null;
  companyId: string;
  role: string;
  companyRole: string;
  projectRoles: string[];
  scopes: string[];
};