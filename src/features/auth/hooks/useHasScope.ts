/** Čistá utilita pro kontrolu scopes. Podporuje anyOf (default) a allOf. */
export function useHasScope(userScopes: string[], required: string | string[], mode: "anyOf" | "allOf" = "anyOf") {
  const need = Array.isArray(required) ? required : [required];
  if (mode === "allOf") return need.every((s) => userScopes.includes(s));
  return need.some((s) => userScopes.includes(s));
}