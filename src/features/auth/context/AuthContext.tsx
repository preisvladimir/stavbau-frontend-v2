import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { MeResponse, LoginResponse } from "@/lib/api/types";
import { AuthService } from "../services/AuthService";
import { tokenManager } from "@/lib/api/tokenManager";

export type AuthState = {
  isAuthenticated: boolean;
 user: MeResponse | null;
  accessToken: string | null;  refreshToken: string | null;
  expiresAt: string | null;
  login: (r: LoginResponse) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [accessToken, setAccess] = useState<string | null>(null);
  const [refreshToken, setRefresh] = useState<string | null>(null);
  const [expiresAt, setExpires] = useState<string | null>(null);

  const isAuthenticated = !!accessToken;

  const logout = useCallback(() => {
    setUser(null); setAccess(null); setRefresh(null); setExpires(null);
  }, []);

  const refreshTokens = useCallback(async () => {
    if (!refreshToken) throw new Error("No refresh token");
    const res = await AuthService.refresh({ refreshToken });
    setAccess(res.accessToken);
    setRefresh(res.refreshToken);
    setExpires(res.expiresAt);
  }, [refreshToken]);

  const login = useCallback(async (r: LoginResponse) => {
    setAccess(r.accessToken);
    setRefresh(r.refreshToken);
   setExpires(r.expiresAt);
    // ihned načti /auth/me
    const me = await AuthService.me();
    setUser(me);
 }, []);

  // registrace tokenManageru pro interceptory (DI)
  useMemo(() => {
    tokenManager.register({
     getAccessToken: () => accessToken,
      getRefreshToken: () => refreshToken,
      refreshTokens,
      onUnauthorized: logout,
    });
  }, [accessToken, refreshToken, refreshTokens, logout]);

  const value: AuthState = {
    isAuthenticated,
    user,
    accessToken,
    refreshToken,
    expiresAt,
    login,
    logout,
    refreshTokens,
 };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};