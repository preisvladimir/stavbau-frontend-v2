// src/lib/api/lookup.ts
import { api } from '@/lib/api/client';
import { langHeader, sanitizeQ, isCanceled } from '@/lib/api/utils';
import { toPageResponse } from '@/lib/api/types/PageResponse';
import { mapAndThrow } from '@/lib/api/problem';

export type SelectOption = { value: string; label: string };

export type OptionsPage = {
  options: SelectOption[];
  total: number;
  hasMore: boolean;
  nextPage: number;
};

export type FetchArgs = {
  q?: string;
  page: number;       // 0-based
  size: number;       // page size
  signal?: AbortSignal;
};

type FixedParams = Record<string, string | number | boolean | undefined>;

type MapItemFn<T = any> = (item: T) => SelectOption;

/**
 * Generický fetcher pro /lookup endpointy.
 * - endpoint: plná URL (doporučeno `${lookupUrl(companyId)}`)
 * - defaultSort: např. 'name,asc' / 'lastName,asc'
 * - fixedParams: doplňkové query parametry (např. { role: 'PROJECT_MANAGER' })
 * - mapItem: když BE nevrací rovnou {value,label}, můžeš přemapovat položky
 */
export function pagedLookupFetcher<T = SelectOption>(
  endpoint: string,
  defaultSort = 'name,asc',
  fixedParams: FixedParams = {},
  mapItem?: MapItemFn<T>
) {
  return async ({ q, page, size, signal }: FetchArgs): Promise<OptionsPage> => {
    const sp = new URLSearchParams();
    if (q != null) sp.set('q', sanitizeQ(q));
    sp.set('page', String(Math.max(0, page)));
    sp.set('size', String(Math.max(1, size)));
    sp.append('sort', defaultSort);

    for (const [k, v] of Object.entries(fixedParams)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') sp.set(k, String(v));
    }

    try {
      const { data } = await api.get(`${endpoint}?${sp.toString()}`, {
        signal,
        headers: langHeader(),
      });

      // BE ideálně vrací PageResponse<SelectOption>, jinak namapuj přes mapItem
      const resp = toPageResponse<T>(data);
      const total = resp.total ?? 0;
      const itemsRaw = resp.items ?? [];

      const options = (mapItem
        ? (itemsRaw as T[]).map(mapItem)
        : (itemsRaw as unknown as SelectOption[])
      ) ?? [];

      const hasMore = (page + 1) * size < total;
      return { options, total, hasMore, nextPage: page + 1 };
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  };
}
