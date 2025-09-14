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
