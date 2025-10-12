// src/lib/api/tokenManager.ts
import type { ApiProblem } from "@/lib/api/problem";

export type Handlers = {
  // Povinné – máš je už implementované v Auth vrstvě
  refreshTokens: () => Promise<void>;
  getAccessToken: () => string | null | undefined;
  getRefreshToken: () => string | null | undefined;

  // Volitelné – globální reakce UI
  onUnauthorized?: () => void;
  onForbidden?: (p?: ApiProblem) => void;
  onRateLimit?: (p?: ApiProblem) => void;
};

/**
 * Lehký DI bridge mezi interceptory a AuthContext, aby nevznikla kruhová závislost.
 * Interceptory nic o UI neví – jen zavolají registrované handlery.
 */
class TokenManager {
  private handlers: Partial<Handlers> = {};

  register(h: Partial<Handlers>) {
    this.handlers = { ...this.handlers, ...h };
  }

  // --- Auth token utils -----------------------------------------------------

  async refreshTokens(): Promise<void> {
    if (!this.handlers.refreshTokens) {
      return Promise.reject(new Error("refreshTokens not set"));
    }
    return this.handlers.refreshTokens();
  }

  getAccessToken(): string | null | undefined {
    return this.handlers.getAccessToken?.();
  }

  getRefreshToken(): string | null | undefined {
    return this.handlers.getRefreshToken?.();
  }

  // --- Globální UI hooks ----------------------------------------------------

  onUnauthorized(): void {
    this.handlers.onUnauthorized?.();
  }

  onForbidden(p?: ApiProblem): void {
    this.handlers.onForbidden?.(p);
  }

  onRateLimit(p?: ApiProblem): void {
    this.handlers.onRateLimit?.(p);
  }
}

export const tokenManager = new TokenManager();
