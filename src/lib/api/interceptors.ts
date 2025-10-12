import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import i18n from '@/i18n';
import { tokenManager } from '@/lib/api/tokenManager';
import { toApiProblem } from '@/lib/api/problem';
import { toast } from "@/ui/toast";

// ---- Axios module augmentation (interní flagy) -----------------------------
declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Zabrání zacyklení – request se po refresh zkusí jen jednou. */
    _retried?: boolean;
    /** Nepokoušet se o refresh (např. samotný /auth/refresh). */
    _skipRefresh?: boolean;
  }
  export interface InternalAxiosRequestConfig<D = any> {
    _retried?: boolean;
    _skipRefresh?: boolean;
  }
}

// ---- Helpers ----------------------------------------------------------------

/** Bezpečné rozlišení jazyka (BCP-47), fallback 'cs'. */
function resolveLanguageTag(): string {
  const lng = (i18n as any)?.language;
  return (typeof lng === 'string' && lng.trim()) ? lng : 'cs';
}

/** case-insensitive kontrola, zda headers už klíč obsahují (pro plain objekty) */
function hasHeaderCI(headers: any, key: string): boolean {
  if (!headers) return false;
  if (typeof headers.has === 'function') return headers.has(key); // AxiosHeaders – case-insensitive
  const lower = key.toLowerCase();
  return Object.keys(headers).some(k => k.toLowerCase() === lower);
}

/** nastavení hlavičky s respektem k AxiosHeaders i plain objektu */
function setHeader(headers: any, key: string, value: string, overrideIfMissingOnly = true) {
  if (!headers) return;
  if (overrideIfMissingOnly && hasHeaderCI(headers, key)) return;
  if (typeof headers.set === 'function') headers.set(key, value); // AxiosHeaders
  else headers[key] = value;                                       // plain object
}

// ---- single-flight refresh fronta ------------------------------------------
let isRefreshing = false;
type Waiter = (newToken: string | null) => void;
const waitQueue: Waiter[] = [];
function enqueue(waiter: Waiter) { waitQueue.push(waiter); }
function flushQueue(token: string | null) {
  while (waitQueue.length) {
    const cb = waitQueue.shift();
    try { cb?.(token); } catch { /* noop */ }
  }
}

// ---- Public API -------------------------------------------------------------
/** Připojí request/response interceptory k dané Axios instance. */
export function withInterceptors(instance: AxiosInstance): AxiosInstance {
  // REQUEST
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const headers: any = config.headers; // InternalAxiosRequestConfig má vždy headers

    // Accept-Language (nepřepisovat, pokud je nastaveno explicitně)
    setHeader(headers, 'Accept-Language', resolveLanguageTag(), /*overrideIfMissingOnly*/ true);

    // Authorization (Bearer) – nepřepisovat, pokud už je header nastaven
    const access = tokenManager.getAccessToken?.();
    if (access) setHeader(headers, 'Authorization', `Bearer ${access}`, /*overrideIfMissingOnly*/ true);

    // U refresh endpointu zakážeme refresh smyčku
    const url = String(config.url ?? '');
    if (url.includes('/auth/refresh')) config._skipRefresh = true;

    return config;
  });

  // RESPONSE
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const { response, config } = error;
      if (!response || !config) return Promise.reject(error);
      const status = response?.status;
      const problem = toApiProblem(error);

      // 403 – předat na hook a odmítnout
      if (status === 403) {
        tokenManager.onForbidden?.(problem);
        return Promise.reject(error);
      }

      // 429 – oznámit; (retry dle Retry-After lze přidat později)
      if (status === 429) {
        tokenManager.onRateLimit?.(problem);
        return Promise.reject(error);
      }

      // 5xx – můžeš mít vlastní default handler/telemetrii
      if (status >= 500) {
        toast.show({
          variant: "error",
          title: "Chyba serveru",
          description: "Došlo k neočekávané chybě. Zkuste to prosím znovu.",
        });
        return Promise.reject(error);
      }

      // 401 – zkuste refresh (pouze 1× a ne pro refresh endpoint)
      const cfg = config as InternalAxiosRequestConfig;
      if (status === 401 && !cfg._skipRefresh && !cfg._retried) {
        cfg._retried = true;

        // Pokud refresh už běží, zařaď se do fronty
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            enqueue((newToken) => {
              if (!newToken) return reject(error);
              setHeader(cfg.headers as any, 'Authorization', `Bearer ${newToken}`, /*overrideIfMissingOnly*/ false);
              resolve(instance.request(cfg));
            });
          });
        }

        // Spusť refresh – single-flight
        isRefreshing = true;
        try {
          // nečekáme návrat tokenu; po refreshi si token načteme sami
          await tokenManager.refreshTokens?.();

          const latestToken = tokenManager.getAccessToken?.() ?? null;
          flushQueue(latestToken);

          if (!latestToken) {
            tokenManager.onUnauthorized?.();
            return Promise.reject(error);
          }

          setHeader(cfg.headers as any, 'Authorization', `Bearer ${latestToken}`, /*overrideIfMissingOnly*/ false);
          return instance.request(cfg);
        } catch {
          tokenManager.onUnauthorized?.();
          flushQueue(null);
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // Ostatní chyby – předat dál
      return Promise.reject(error);
    }
  );

  return instance;
}
