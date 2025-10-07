import axios from "axios";
import { withInterceptors } from "./interceptors";
import { getEnv } from "../utils/env";

/** 
 * Axios klient s bezpečným baseURL fallbackem.
 * Priorita: VITE_API_BASE_URL → VITE_API_URL → '/api'
 * Pozn.: Accept-Language + Authorization řeší interceptory.
 */
function resolveBaseUrl(): string {
  // getEnv u tebe umí vyhodit chybu, proto používáme try/catch a postupný fallback
  try {
    const v = getEnv("VITE_API_BASE_URL");
    if (v) return v;
  } catch {}
  try {
    const v = getEnv("VITE_API_URL");
    if (v) return v;
  } catch {}
  return "/api/v1";
}

/** Axios klient (s interceptory) */
export const api = withInterceptors(
  axios.create({
    baseURL: resolveBaseUrl(),
    withCredentials: true,             // ⬅️ DŮLEŽITÉ pro cookie RT
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  })
);

export default api;
