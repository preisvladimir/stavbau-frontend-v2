import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosError } from "axios";
import { tokenManager } from "./tokenManager";
import i18n from "@/i18n";

let isRefreshing = false;
let waitQueue: Array<() => void> = [];

function onRefreshed() {
  waitQueue.forEach((cb) => cb());
  waitQueue = [];
}

function enqueue(cb: () => void) {
  waitQueue.push(cb);
}

export function withInterceptors(instance: AxiosInstance) {
  // Request: Authorization header
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const access = tokenManager.getAccessToken();
    const lang =
      i18n.resolvedLanguage || (i18n as any).language || "cs"; // fallback    
    if (access) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${access}`;
    }
    if (!config.headers["Accept-Language"]) {
      config.headers["Accept-Language"] = lang;
    }    
    return config;
  });

  // Response: 401→refresh→retry, 403/429 UX
  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as AxiosRequestConfig & { _retried?: boolean; _skipRefresh?: boolean };
      const status = error.response?.status;

      // ⛳️ Pojistka: speciálně označené requesty (např. první /auth/me po loginu) NErefreshujeme
      if (status === 401 && original?._skipRefresh) {
        tokenManager.onUnauthorized?.();
        return Promise.reject(error);
      }     

      if (status === 401 && !original?._retried) {
        if (!tokenManager.getRefreshToken()) {
          tokenManager.onUnauthorized?.();
          return Promise.reject(error);
        }
        if (isRefreshing) {
          // čekej na dokončení refresh
         await new Promise<void>((resolve) => enqueue(resolve));
          original._retried = true;
          return instance(original);
        }
        try {
          isRefreshing = true;
          await tokenManager.refreshTokens(); // delegováno do AuthContext
         onRefreshed();
          original._retried = true;
          return instance(original);
        } catch (e) {
          tokenManager.onUnauthorized?.();
          return Promise.reject(e);
        } finally {
         isRefreshing = false;
        }
     }

      if (status === 403) {
        tokenManager.onForbidden?.(error);
    } else if (status === 429) {
        tokenManager.onRateLimit?.(error);
     }
      return Promise.reject(error);
    }
  );
  return instance;
}
