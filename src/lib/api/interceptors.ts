import type { AxiosInstance } from "axios";

/** TODO: request: Authorization Bearer; response: 401→refresh→retry, 403/429 UX */
export function withInterceptors(instance: AxiosInstance) {
  // TODO: add request/response interceptors + singleflight refresh
  return instance;
}
