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
