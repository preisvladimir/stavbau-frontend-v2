type Handlers = {
  refreshTokens: () => Promise<void>;
  getAccessToken: () => string | null | undefined;
  getRefreshToken: () => string | null | undefined;
  onUnauthorized?: () => void;
  onForbidden?: (e: unknown) => void;
  onRateLimit?: (e: unknown) => void;
};

// Lehký DI bridge mezi interceptory a AuthContext, aby nevznikla kruhová závislost.
class TokenManager {
  private handlers: Partial<Handlers> = {};
  register(h: Partial<Handlers>) { this.handlers = { ...this.handlers, ...h }; }
  async refreshTokens() { return this.handlers.refreshTokens?.() ?? Promise.reject("refreshTokens not set"); }
  getAccessToken() { return this.handlers.getAccessToken?.(); }
  getRefreshToken() { return this.handlers.getRefreshToken?.(); }
  onUnauthorized?() { return this.handlers.onUnauthorized?.(); }
  onForbidden?(e: unknown) { return this.handlers.onForbidden?.(e); }
  onRateLimit?(e: unknown) { return this.handlers.onRateLimit?.(e); }
}

export const tokenManager = new TokenManager();