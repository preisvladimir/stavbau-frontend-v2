// src/lib/api/types/PageResponse.ts

// Minimální Spring Page tvar (rozšířený o běžná volitelná pole)
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

// Jednotný FE kontrakt — vždy doplníme items/page/size/total,
// zároveň zachováme raw Spring Page pole, pokud jsou k dispozici.
export type PageResponse<T> = {
  // normalizované (vždy přítomné)
  items: T[];
  page: number;
  size: number;
  total: number;
  // raw Spring Page pole (pokud dorazí, zachováme je)
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

// Standardní stránkovaná odpověď (pro generiky/rozhraní)
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

// Type guards
export function isSpringPage<T = unknown>(v: any): v is SpringPage<T> {
  return v && Array.isArray(v.content) && typeof v.number === 'number' && typeof v.size === 'number';
}
export function isAlreadyPageResponse<T = unknown>(v: any): v is PageResponse<T> {
  return v && Array.isArray(v.items) && typeof v.page === 'number' && typeof v.size === 'number';
}

// Prázdná stránka (užitečné pro inicializace/testy)
export function emptyPage<T>(): PageResponse<T> {
  return { items: [], page: 0, size: 0, total: 0 };
}

/**
 * Unifikovaný adaptér:
 * - Spring Page → doplní items/page/size/total a zachová raw pole (content/number/totalElements…)
 * - Pokud už přijde FE PageResponse, jen ho vrátí (idempotentní)
 * - Jinak se pokusí rozumně zmapovat nejdůležitější pole
 */
export function toPageResponse<T = unknown>(payload: any): PageResponse<T> {
  if (!payload) return emptyPage<T>();

  if (isAlreadyPageResponse<T>(payload)) {
    return payload;
  }

  if (isSpringPage<T>(payload)) {
    const res: PageResponse<T> = {
      items: payload.content ?? [],
      page: typeof payload.number === 'number' ? payload.number : 0,
      size: typeof payload.size === 'number' ? payload.size : (payload.content?.length ?? 0),
      total: typeof payload.totalElements === 'number' ? payload.totalElements : (payload.content?.length ?? 0),
      // zachovej raw
      content: payload.content,
      number: payload.number,
      totalElements: payload.totalElements,
      totalPages: payload.totalPages,
      first: payload.first,
      last: payload.last,
      numberOfElements: payload.numberOfElements,
      empty: payload.empty,
      sort: payload.sort,
      pageable: payload.pageable,
    };
    return res;
  }

  // Fallback: zkus uhodnout základ
  return {
    items: payload.items ?? payload.content ?? [],
    page: payload.page ?? payload.number ?? 0,
    size: payload.size ?? (payload.items?.length ?? payload.content?.length ?? 0),
    total: payload.total ?? payload.totalElements ?? (payload.items?.length ?? payload.content?.length ?? 0),
    content: payload.content,
    number: payload.number,
    totalElements: payload.totalElements,
    totalPages: payload.totalPages,
    first: payload.first,
    last: payload.last,
    numberOfElements: payload.numberOfElements,
    empty: payload.empty,
    sort: payload.sort,
    pageable: payload.pageable,
  };
}
