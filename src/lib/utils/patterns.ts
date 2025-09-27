// src/utils/patterns.ts

/** 8 číslic (IČO) */
export const ICO_REGEX = /^\d{8}$/;

/** PSČ: 12345 nebo 123 45 */
export const ZIP_CZ_REGEX = /^\d{3}\s?\d{2}$/;

/** ISO 3166-1 alpha-2 (dvě velká písmena) */
export const ISO2_REGEX = /^[A-Z]{2}$/;

/**
 * Email – tolerantní varianta (frontend validace + HTML pattern).
 * - String pro <input pattern={...}>: použijeme String.raw, ať nemusíš zdvojovat backslashe
 * - RegExp pro JS validaci (case-insensitive)
 */
export const EMAIL_INPUT_PATTERN = String.raw`^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

/**
 * Email – přísnější (zjednodušené RFC 5322). Používej jen pokud opravdu chceš „tvrdé“ validace.
 */
export const EMAIL_REGEX_STRICT =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;


// src/lib/validators/cz.ts
export function isValidICO(ico?: string | null): boolean {
  if (!ico) return true; // prázdné je OK (není povinné)
  const digits = ico.replace(/\s+/g, '');
  if (!/^\d{8}$/.test(digits)) return false;
  const nums = digits.split('').map((d) => Number(d));
  const weights = [8, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * nums[i], 0);
  let mod = sum % 11;
  let check = 0;
  if (mod === 0) check = 1;
  else if (mod === 10) check = 1;
  else if (mod === 1) check = 0;
  else check = 11 - mod;
  return nums[7] === check;
}

export function isValidCZDic(dic?: string | null): boolean {
  if (!dic) return true; // nepovinné
  const s = dic.replace(/\s+/g, '').toUpperCase();
  if (!s.startsWith('CZ')) return false;
  const rest = s.slice(2);
  return /^\d{8,10}$/.test(rest);
}