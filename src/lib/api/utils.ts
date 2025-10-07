import i18n from '@/i18n';

// Čísla / stránkování
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export const toInt = (v: unknown, fallback = 0) =>
  Number.isFinite(Number(v)) ? (Number(v) | 0) : fallback;

// Query sanitizace
export const sanitizeQ = (q?: string, maxLen = 200) => (q ?? '').trim().slice(0, maxLen);

// Detekce zrušených požadavků (fetch/axios)
export const isCanceled = (e: unknown): boolean =>
  (e as any)?.code === 'ERR_CANCELED' ||
  (e as any)?.name === 'AbortError' ||
  (e as any)?.name === 'CanceledError' ||
  (e as any)?.message === 'canceled';

// Jazyková hlavička
export const langHeader = () => ({ 'Accept-Language': i18n.language });

// Shallow compact: zahodí null/undefined, zachová keyof T
export function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  const out = {} as Partial<T>;
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (v !== null && v !== undefined) (out as any)[k] = v;
  });
  return out;
}

// Zahodí null/undefined a prázdné stringy
export function compactNonEmpty<T extends Record<string, any>>(obj: T): Partial<T> {
  const out = {} as Partial<T>;
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (v === null || v === undefined) return;
    if (typeof v === 'string' && v.trim() === '') return;
    (out as any)[k] = v;
  });
  return out;
}

// "" → undefined (neposílat parametr)
export const toNonEmpty = (v?: string) => {
  const s = (v ?? '').trim();
  return s ? s : undefined;
};

// Normalizace sortu; pokud je předán allowlist, vynutíme ho
export const normalizeSort = (s?: string, allowed?: ReadonlySet<string>) => {
  if (!s) return undefined;
  const [rawKey, rawDir = 'asc'] = s.split(',', 2);
  const key = rawKey?.trim();
  if (!key) return undefined;
  if (allowed && !allowed.has(key)) return undefined;
  const dir = rawDir.toLowerCase() === 'desc' ? 'desc' : 'asc';
  return `${key},${dir}`;
};