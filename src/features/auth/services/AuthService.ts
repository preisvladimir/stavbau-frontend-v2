//import { api } from "@/lib/api/client";
import type { LoginRequest, LoginResponse, MeResponse, RefreshRequest, RefreshResponse } from "@/lib/api/types";

/** TODO: volání /auth/login, /auth/me, /auth/refresh (jen signatury) */
export const AuthService = {
  login: async (_payload: LoginRequest): Promise<LoginResponse> => {
    // TODO: implement
    return Promise.reject(new Error("Not implemented"));
  },
  me: async (): Promise<MeResponse> => Promise.reject(new Error("Not implemented")),
  refresh: async (_payload: RefreshRequest): Promise<RefreshResponse> => Promise.reject(new Error("Not implemented")),
};
