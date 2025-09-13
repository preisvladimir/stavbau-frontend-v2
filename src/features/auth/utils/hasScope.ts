/** Čistá utilita pro kontrolu scopes (anyOf/allOf – zatím anyOf). TODO: rozšířit */
export function hasScope(userScopes: string[], required: string | string[]) {
  const need = Array.isArray(required) ? required : [required];
  return need.some((s) => userScopes.includes(s));
}
