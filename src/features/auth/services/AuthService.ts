import { api } from "@/lib/api/client";
import type { LoginRequest, LoginResponse, MeResponse, RefreshRequest, RefreshResponse } from "@/lib/api/types";

export const AuthService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", payload);
    return data;
  },
  // optional Access Token pro první volání po loginu (obejde race condition)
  async me(accessToken?: string): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>("/auth/me", {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      // ⛳️ První volání po loginu označíme, aby 401 nevyvolala refresh-loop
      _skipRefresh: !!accessToken,
    } as any);
     return data;
   },
  async refresh(payload: RefreshRequest): Promise<RefreshResponse> {
    const { data } = await api.post<RefreshResponse>("/auth/refresh", payload);
    return data;
  },
};
