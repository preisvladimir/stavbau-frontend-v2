import type { ProblemDetail } from "@/lib/api/types";

export type MappedRegistrationError =
  | { kind: "field"; field: "owner.email"; i18nKey: string }
  | { kind: "flow"; goToStep?: 1 | 2 | 3; i18nKey: string }
  | { kind: "unknown"; i18nKey: string };

export function mapRegistrationError(pd?: ProblemDetail): MappedRegistrationError {
  if (!pd) return { kind: "unknown", i18nKey: "errors.generic" };

  // ARES (krok 1)
  if (pd.status === 404 && pd.code === "ares_not_found") {
    return { kind: "flow", goToStep: 1, i18nKey: "errors.ares.not_found" };
  }
  if (pd.status === 503 && pd.code === "ares_unavailable") {
    return { kind: "flow", goToStep: 1, i18nKey: "errors.ares.unavailable" };
  }
  if (pd.status === 429) {
    return { kind: "flow", goToStep: 1, i18nKey: "errors.ares.rate_limit" };
  }

  // Registrace (krok 3)
  if (pd.status === 409 && pd.code === "user.email.exists") {
    return { kind: "field", field: "owner.email", i18nKey: "errors.user.email.exists" };
  }
  if (pd.status === 409 && pd.code === "company.exists") {
    return { kind: "flow", goToStep: 1, i18nKey: "errors.company.exists" };
  }

  // 400 validation – obecný fallback (konkrétní validační mapování doplníme v PR 5/7)
  if (pd.status === 400) {
    return { kind: "unknown", i18nKey: "errors.validation.generic" };
  }

  return { kind: "unknown", i18nKey: "errors.generic" };
}
