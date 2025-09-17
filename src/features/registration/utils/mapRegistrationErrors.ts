import type { ProblemDetail } from "@/lib/api/types";

export type MappedRegistrationError =
  | { kind: "field"; field: "owner.email"; i18nKey: string }
  | { kind: "flow"; goToStep?: 1 | 2 | 3; i18nKey: string }
  | { kind: "unknown"; i18nKey: string };

export function mapRegistrationError(pd?: ProblemDetail): MappedRegistrationError {
  if (!pd) return { kind: "unknown", i18nKey: "errors.generic" };

  const status = typeof pd.status === "number" ? pd.status : Number(pd.status ?? 0);
  const code = pd.code ?? "";

  // --- ARES (krok 1) — prefer 'code', fallback na 'status'
  if (code === "ares_not_found" || status === 404) {
    return { kind: "flow", goToStep: 1, i18nKey: "errors.ares.not_found" };
  }
  if (code === "ares_unavailable" || status === 503) {
    return { kind: "flow", goToStep: 1, i18nKey: "errors.ares.unavailable" };
  }
  if (code === "rate_limit" || status === 429) {
    return { kind: "flow", goToStep: 1, i18nKey: "errors.ares.rate_limit" };
  }

  // --- Registrace (krok 3) — konflikty 409
  if (status === 409 && code === "user.email.exists") {
    return { kind: "field", field: "owner.email", i18nKey: "errors.user.email.exists" };
  }
  if (status === 409 && code === "company.exists") {
    return { kind: "flow", goToStep: 1, i18nKey: "errors.company.exists" };
  }

  // --- Validation 400 (obecný fallback; field-level řešíme ve volající vrstvě podle pd.path)
  if (status === 400) {
    return { kind: "unknown", i18nKey: "errors.validation.generic" };
  }

  // --- Autorizace / obecné HTTP
  if (status === 401) return { kind: "unknown", i18nKey: "errors.401" };
  if (status === 403) return { kind: "unknown", i18nKey: "errors.403" };
  if (status >= 500 && status <= 599) return { kind: "unknown", i18nKey: "errors.5xx" };

  // --- Fallback
  return { kind: "unknown", i18nKey: "errors.generic" };
}
