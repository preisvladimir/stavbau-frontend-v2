import React, { createContext, useContext } from "react";
import type { MeResponse, LoginResponse } from "@/lib/api/types";

/** TODO: držet v paměti access/refresh/expiresAt, user, role, scopes */
export type AuthState = {
  isAuthenticated: boolean;
  user?: MeResponse | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: string | null;
  login: (_r: LoginResponse) => void;   // TODO: doplnit signaturu podle implementace
  logout: () => void;
  refreshTokens: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // TODO: state + provider
  const value: AuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    login: () => {},
    logout: () => {},
    refreshTokens: async () => {},
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};
