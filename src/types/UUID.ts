// src/types/index.ts
declare const __uuidBrand: unique symbol;
export type UUID = string & { readonly [__uuidBrand]: 'uuid' };
export type IdLike = UUID | string;

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUUID(value: unknown): value is UUID {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/** Bezpečné zabalení: nevalidní hodnoty vrátí null */
export function toUUID(value: string | null | undefined): UUID | null {
  return value && isUUID(value) ? (value as UUID) : null;
}

/** Přísné ověření: vyhodí chybu při nevalidním vstupu */
export function ensureUUID(value: string): UUID {
  if (!isUUID(value)) throw new Error(`Invalid UUID: ${value}`);
  return value as UUID;
}

/** Nevaliduje – použít jen tam, kde GARANTUJEŠ validitu upstreamem */
export function asUUIDUnsafe(value: string): UUID {
  return value as UUID;
}
