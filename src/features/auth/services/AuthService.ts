import { api } from "@/lib/api/client";
import type { LoginRequest, LoginResponse, MeResponse, RefreshRequest, RefreshResponse } from "@/lib/api/types";

export const AuthService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", payload);
    return data;
  },
  async me(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>("/auth/me");
    return data;
  },
  async refresh(payload: RefreshRequest): Promise<RefreshResponse> {
    const { data } = await api.post<RefreshResponse>("/auth/refresh", payload);
    return data;
  },
};
