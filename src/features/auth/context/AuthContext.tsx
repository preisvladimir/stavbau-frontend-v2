import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type PropsWithChildren,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { MeResponse, LoginResponse } from "@/types/common/user";
import { AuthService } from "../services/AuthService";
import { tokenManager } from "@/lib/api/tokenManager";

export type AuthState = {
  isAuthenticated: boolean;
  user: MeResponse | null;
  /** Odvozené z user?.companyId (single-tenant). Nikdy neukládej stranou. */
  readonly companyId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;

  /** Aplikační bootstrap autentizace (probíhá tichý refresh po startu) */
  authBooting: boolean;

  /** Přihlášení – uloží tokeny, načte /auth/me s čerstvým access tokenem */
  login: (r: LoginResponse) => Promise<void>;
  /** Odhlášení – vyčistí stav, zruší pending requesty, redirect na /login */
  logout: (opts?: { server?: boolean }) => Promise<void>;
  /** Obnovení tokenů – voláno z interceptorů přes tokenManager */
  refreshTokens: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// konstanta pro flag
const SKIP_BOOTSTRAP_KEY = "sb_skip_bootstrap";

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [accessToken, setAccess] = useState<string | null>(null);
  const [refreshToken, setRefresh] = useState<string | null>(null);
  const [expiresAt, setExpires] = useState<string | null>(null);
  const [authBooting, setAuthBooting] = useState<boolean>(true);

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
      // 1) umlčet interceptory + vymazat FE state
      hardResetTokens();

      // 2) zrušit pending requesty
      abortRef.current?.abort();
      abortRef.current = null;

      // 3) vyčistit fallbacky a nastavit flag, ať se bootstrap hned po redirectu nespustí
      try {
        sessionStorage.removeItem("rt");
        sessionStorage.setItem(SKIP_BOOTSTRAP_KEY, "1");
      } catch {}

      // 4) volitelně BE logout (cookie invalidace)
      if (opts?.server && refreshToken) {
        await AuthService.logout(refreshToken).catch(() => {});
      }

      // 5) redirect na /login
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

      // (Volitelný fallback) uložit RT do sessionStorage pro případ, že BE nemá cookie flow
      try {
        sessionStorage.setItem("rt", r.refreshToken);
      } catch {}

      setAccess(r.accessToken);
      setRefresh(r.refreshToken);
      setExpires(r.expiresAt);

      // První /auth/me s čerstvým tokenem (v AuthService.me se používá _skipRefresh)
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

  /**
   * Bootstrap autentizace při startu app:
   * 1) zkus refresh BE cookie → /auth/refresh (bez payloadu)
   * 2) pokud selže, fallback: sessionStorage('rt') → /auth/refresh({ refreshToken })
   * 3) po úspěchu /auth/me
   */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const onDone = () => mounted && setAuthBooting(false);

      // Skip bootstrap na /login nebo pokud jsme právě udělali logout
      const onLoginRoute = location.pathname.startsWith("/login");
      let skip = false;
      try {
        skip = sessionStorage.getItem(SKIP_BOOTSTRAP_KEY) === "1";
      } catch {}

      if (onLoginRoute || skip) {
        // spotřebuj skip flag (ať neblokuje další navigace)
        try { sessionStorage.removeItem(SKIP_BOOTSTRAP_KEY); } catch {}
        return onDone();
      }

      try {
        if (accessToken) return onDone(); // už přihlášen

        // 1) cookie flow (preferované)
        try {
          const r = await AuthService.refresh(); // bez payloadu → HttpOnly cookie
          if (!mounted) return;
          setAccess(r.accessToken);
          setRefresh(r.refreshToken);
          setExpires(r.expiresAt);
          tokenManager.register({
            getAccessToken: () => r.accessToken,
            getRefreshToken: () => r.refreshToken,
            refreshTokens,
            onUnauthorized: logout,
          });
          const me = await AuthService.me(r.accessToken);
          if (!mounted) return;

          // ✅ VALIDACE /auth/me
          if (!me?.companyRole || !me?.scopes || me.scopes.length === 0) {
            await logout({ server: false }); // ghost session → odhlaš
            return;
          }

          setUser(me);
          return onDone();
        } catch {
          // fallthrough na fallback
        }

        // 2) sessionStorage fallback (pokud používáš)
        try {
          const rt = sessionStorage.getItem("rt");
          if (!rt) return onDone();
          const r = await AuthService.refresh({ refreshToken: rt });
          if (!mounted) return;
          setAccess(r.accessToken);
          setRefresh(r.refreshToken);
          setExpires(r.expiresAt);
          try { sessionStorage.setItem("rt", r.refreshToken); } catch {}
          tokenManager.register({
            getAccessToken: () => r.accessToken,
            getRefreshToken: () => r.refreshToken,
            refreshTokens,
            onUnauthorized: logout,
          });
          const me = await AuthService.me(r.accessToken);
          if (!mounted) return;

          // ✅ VALIDACE /auth/me
          if (!me?.companyRole || !me?.scopes || me.scopes.length === 0) {
            await logout({ server: false });
            return;
          }

          setUser(me);
        } catch {
          // žádná validní session → zůstane odhlášen
        }
      } finally {
        onDone();
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // jen při mountu
  const companyId = user?.companyId ?? null;
  const value: AuthState = {
    isAuthenticated,
    user,
    companyId,
    accessToken,
    refreshToken,
    expiresAt,
    authBooting,
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
