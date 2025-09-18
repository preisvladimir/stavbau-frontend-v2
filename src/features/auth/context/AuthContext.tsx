import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
  type PropsWithChildren,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { MeResponse, LoginResponse } from "@/lib/api/types";
import { AuthService } from "../services/AuthService";
import { tokenManager } from "@/lib/api/tokenManager";

export type AuthState = {
  isAuthenticated: boolean;
  user: MeResponse | null;

  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;

  /** Přihlášení – uloží tokeny, načte /auth/me s čerstvým access tokenem */
  login: (r: LoginResponse) => Promise<void>;
  /** Odhlášení – vyčistí stav, zruší pending requesty, redirect na /login */
  logout: (opts?: { server?: boolean }) => Promise<void>;
  /** Obnovení tokenů – voláno z interceptorů přes tokenManager */
  refreshTokens: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [accessToken, setAccess] = useState<string | null>(null);
  const [refreshToken, setRefresh] = useState<string | null>(null);
  const [expiresAt, setExpires] = useState<string | null>(null);

  const isAuthenticated = !!accessToken;

  const navigate = useNavigate();
  const location = useLocation();

  /** Abort všech rozjetých požadavků při logoutu */
  const abortRef = useRef<AbortController | null>(null);

  const hardResetTokens = useCallback(() => {
    // interceptorům dáme „prázdný“ zdroj pravdy
    tokenManager.register({
      getAccessToken: () => null,
      getRefreshToken: () => null,
      refreshTokens: async () => {},
      onUnauthorized: undefined,
      onForbidden: undefined,
      onRateLimit: undefined,
    });
    setAccess(null);
    setRefresh(null);
    setExpires(null);
    setUser(null);
  }, []);

  const logout = useCallback(
    async (opts?: { server?: boolean }) => {
      // 1) okamžitě „umlčet“ interceptory
      hardResetTokens();

      // 2) zrušit pending requesty
      abortRef.current?.abort();
      abortRef.current = null;

      // 3) volitelně informovat BE
      if (opts?.server && refreshToken) {
        await AuthService.logout(refreshToken).catch(() => {});
      }

      // 4) redirect na login (s návratem)
      const here = `${location.pathname}${location.search}`;
      const redirectTo =
        here && !here.startsWith("/login")
          ? `?redirectTo=${encodeURIComponent(here)}`
          : "";
      navigate(`/login${redirectTo}`, { replace: true });
    },
    [hardResetTokens, navigate, location.pathname, location.search, refreshToken]
  );

  const refreshTokens = useCallback(async () => {
    if (!refreshToken) {
      await logout();
      throw new Error("No refresh token");
    }
    const res = await AuthService.refresh({ refreshToken });
    setAccess(res.accessToken);
    setRefresh(res.refreshToken);
    setExpires(res.expiresAt);
  }, [logout, refreshToken]);

  const login = useCallback(
    async (r: LoginResponse) => {
      // ⛳️ Okamžitá registrace tokenů pro interceptory (nečekáme na re-render)
      tokenManager.register({
        getAccessToken: () => r.accessToken,
        getRefreshToken: () => r.refreshToken,
        refreshTokens,
        onUnauthorized: logout,
      });

      setAccess(r.accessToken);
      setRefresh(r.refreshToken);
      setExpires(r.expiresAt);

      // První /auth/me s čerstvým tokenem (v AuthService.me nastavujeme _skipRefresh)
      const me = await AuthService.me(r.accessToken);
      setUser(me);
    },
    [logout, refreshTokens]
  );

  // Registrace tokenManageru po každé změně state (stane se „zdrojem pravdy“)
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
