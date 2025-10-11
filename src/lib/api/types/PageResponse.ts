// src/lib/api/types/PageResponse.ts

/**
 * 🔒 FE kontrakt (0-based stránkování)
 * Vždy garantujeme:
 *  - items: T[]
 *  - page: number (0-based, >= 0)
 *  - size: number (>= 0)
 *  - total: number (>= 0, vždy >= items.length)
 *
 * Zároveň uchováváme raw Spring Page pole, pokud přijdou.
 */

// -----------------------------
// Spring typ (jak leze z BE)
// -----------------------------
export type SpringPage<T> = {
  content: T[];
  number: number;           // 0-based index
  size: number;
  totalElements: number;

  // volitelná raw pole, která Spring umí posílat
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
  sort?: unknown;
  pageable?: unknown;
};

// ------------------------------------------
// FE kontrakt – vždy normalizovaný (0-based)
// ------------------------------------------
export type PageResponse<T> = {
  // normalizované (vždy přítomné)
  items: T[];
  page: number; // 0-based
  size: number;
  total: number;

  // raw Spring Page pole (pokud dorazí, zachováme je ‚as-is‘)
  content?: T[];
  number?: number;
  totalElements?: number;

  // volitelná raw pole
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
  sort?: unknown;
  pageable?: unknown;
};

// Lehká verze pro obecné generické deklarace
export interface PageResponseInterface<T> {
  items: T[];
  page?: number;
  size?: number;
  total?: number;
}

// Cursor-based stránkování (rezerva do budoucna)
export type CursorPageResponse<T> = {
  items: T[];
  cursor?: string | null;
  hasMore?: boolean;
};

// -----------------------------
// Type guards
// -----------------------------
export function isSpringPage<T = unknown>(v: any): v is SpringPage<T> {
  return !!v
    && Array.isArray(v.content)
    && typeof v.number === 'number'
    && typeof v.size === 'number';
}

export function isAlreadyPageResponse<T = unknown>(v: any): v is PageResponse<T> {
  return !!v
    && Array.isArray(v.items)
    && typeof v.page === 'number'
    && typeof v.size === 'number'
    && typeof v.total === 'number'; // důležité: trvej i na total
}

// -----------------------------
// Utility helpers (defenzivně)
// -----------------------------
function isFiniteNumber(n: any): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function toNonNegativeInt(n: any, fallback: number): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return Math.max(0, Math.trunc(fallback));
  return Math.max(0, Math.trunc(x));
}

function coerceSize(value: any, fallbackFromItemsLen: number): number {
  const n = toNonNegativeInt(value, fallbackFromItemsLen);
  return n;
}

function coerceTotal(value: any, min: number): number {
  const n = toNonNegativeInt(value, min);
  // total musí být alespoň počet položek na aktuální stránce
  return Math.max(n, min);
}

function safeItems<T>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// -----------------------------
// Veřejné API
// -----------------------------
export function emptyPage<T>(): PageResponse<T> {
  return { items: [], page: 0, size: 0, total: 0 };
}

/**
 * Unifikovaný adaptér:
 * 1) FE PageResponse → pečlivě normalizuje (klampuje hodnoty)
 * 2) Spring Page      → mapuje na FE kontrakt a zachová raw
 * 3) Pole             → zabalí do single-page odpovědi
 * 4) Jiný objekt      → pokusí se rozumně zmapovat klíče (items/content, page/number, total/totalElements)
 *
 * Vždy vrátí validní { items, page (0-based), size, total }.
 */
export function toPageResponse<T = unknown>(payload: any): PageResponse<T> {
  // 0) Falsy → prázdná stránka
  if (!payload) return emptyPage<T>();

  // 1) Už normalizovaný FE kontrakt
  if (isAlreadyPageResponse<T>(payload)) {
    const items = safeItems<T>(payload.items);
    const page = toNonNegativeInt(payload.page, 0);            // 0-based
    const size = coerceSize(payload.size, items.length);
    const total = coerceTotal(payload.total, items.length);
    return {
      ...payload,
      items,
      page,
      size,
      total,
    };
  }

  // 2) Prosté pole → single-page odpověď
  if (Array.isArray(payload)) {
    const items = payload as T[];
    return {
      items,
      page: 0,
      size: items.length,
      total: items.length,
    };
  }

  // 3) Spring Page
  if (isSpringPage<T>(payload)) {
    const items = safeItems<T>(payload.content);
    const page = toNonNegativeInt(payload.number, 0);           // 0-based
    const size = coerceSize(payload.size, items.length);
    const total = coerceTotal(payload.totalElements, items.length);

    return {
      items,
      page,
      size,
      total,
      // zachováme raw pole bez modifikace (pro případnou diagnostiku/UI)
      content: payload.content,
      number: payload.number,
      totalElements: payload.totalElements,
      totalPages: isFiniteNumber(payload.totalPages) ? payload.totalPages : undefined,
      first: typeof payload.first === 'boolean' ? payload.first : undefined,
      last: typeof payload.last === 'boolean' ? payload.last : undefined,
      numberOfElements: isFiniteNumber(payload.numberOfElements) ? payload.numberOfElements : undefined,
      empty: typeof payload.empty === 'boolean' ? payload.empty : undefined,
      sort: payload.sort,
      pageable: payload.pageable,
    };
  }

  // 4) Ostatní objekty (neznámý tvar) → best-effort mapování
  const maybeItems = (payload as any)?.items ?? (payload as any)?.content;
  const items = safeItems<T>(maybeItems);
  const page = toNonNegativeInt((payload as any)?.page ?? (payload as any)?.number, 0);
  const size = coerceSize((payload as any)?.size, items.length);
  const total = coerceTotal((payload as any)?.total ?? (payload as any)?.totalElements, items.length);

  const resp: PageResponse<T> = {
    items,
    page,
    size,
    total,
  };

  // přibal raw, pokud existují (bez validace)
  if ('content' in (payload as any)) resp.content = (payload as any).content;
  if ('number' in (payload as any)) resp.number = (payload as any).number;
  if ('totalElements' in (payload as any)) resp.totalElements = (payload as any).totalElements;
  if ('totalPages' in (payload as any)) resp.totalPages = (payload as any).totalPages;
  if ('first' in (payload as any)) resp.first = (payload as any).first;
  if ('last' in (payload as any)) resp.last = (payload as any).last;
  if ('numberOfElements' in (payload as any)) resp.numberOfElements = (payload as any).numberOfElements;
  if ('empty' in (payload as any)) resp.empty = (payload as any).empty;
  if ('sort' in (payload as any)) resp.sort = (payload as any).sort;
  if ('pageable' in (payload as any)) resp.pageable = (payload as any).pageable;

  return resp;
}
