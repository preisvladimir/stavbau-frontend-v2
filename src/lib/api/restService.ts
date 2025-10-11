// src/lib/api/restService.ts
import { api } from '@/lib/api/client';
import { mapAndThrow } from '@/lib/api/problem';
import { toPageResponse, type PageResponse } from '@/lib/api/types/PageResponse';
import { sanitizeQ, isCanceled, langHeader, compact } from '@/lib/api/utils';

export type UUID = string;
export type SelectOption = { value: string; label: string };

export type ListParams<F = unknown> = {
  q?: string;
  page?: number;          // 0-based
  size?: number;          // default 10
  sort?: string | string[];
  filters?: F;
  signal?: AbortSignal;
};

export type LookupParams = {
  q?: string;
  page?: number;          // 0-based
  size?: number;          // default 10
  sort?: string | string[];
  signal?: AbortSignal;
};

export type OptionsPage = {
  options: SelectOption[];
  hasMore?: boolean;
  nextPage?: number | null;
  total?: number;
};

type Paths<Id = UUID> = {
  base: (companyId: UUID | string) => string;
  item: (companyId: UUID | string, id: Id) => string;
  lookup?: (companyId: UUID | string) => string;
  archive?: (companyId: UUID | string, id: Id) => string;
  unarchive?: (companyId: UUID | string, id: Id) => string;
  remove?: (companyId: UUID | string, id: Id) => string; // když není → použije se item()
};

/**
 * ⚠️ Pozn.: Config nepotřebuje znát Detail/Create/Update typy → odstraněno,
 * tím mizí i TS6133 "declared but never read".
 */
export type RestServiceConfig<Id = UUID, F = unknown, Summary = unknown> = {
  paths: Paths<Id>;
  defaultSort?: string | string[];
  filtersToQuery?: (filters: F) => Record<string, string | undefined>;
  toOptionFromSummary?: (x: Summary) => SelectOption;
};

/**
 * Generika:
 * - CreateReq/UpdateReq ⬅️ teď mají constraint `extends Record<string, any>`
 *   aby je šlo bezpečně posílat přes compact<T>.
 */
export function createRestService<
  Id = UUID,
  F = unknown,
  Summary = unknown,
  Detail = unknown,
  CreateReq extends Record<string, any> = Record<string, any>,
  UpdateReq extends Record<string, any> = Record<string, any>
>(cfg: RestServiceConfig<Id, F, Summary>) {

  function buildSearchParams(input: { q?: string; page?: number; size?: number; sort?: string | string[]; filters?: F }) {
    const { q, page = 0, size = 10, sort = cfg.defaultSort ?? 'createdAt,desc', filters } = input ?? {};
    const finalSort = Array.isArray(sort) ? sort : [sort];

    const sp = new URLSearchParams();
    if (q != null) sp.set('q', sanitizeQ(q));
    sp.set('page', String(Math.max(0, page)));
    sp.set('size', String(Math.max(1, size)));
    for (const s of finalSort) sp.append('sort', s);

    if (filters && cfg.filtersToQuery) {
      const extra = cfg.filtersToQuery(filters);
      Object.entries(extra).forEach(([k, v]) => {
        if (v != null && String(v).trim() !== '') sp.set(k, v);
      });
    }
    return sp;
  }

  async function list(companyId: UUID | string, params: ListParams<F> = {}): Promise<PageResponse<Summary>> {
    const sp = buildSearchParams(params);
    try {
      const { data } = await api.get(`${cfg.paths.base(companyId)}?${sp.toString()}`, {
        signal: params.signal,
        headers: langHeader(),
      });
      return toPageResponse<Summary>(data);
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  }

  async function lookup(companyId: UUID | string, params: LookupParams = {}): Promise<PageResponse<SelectOption>> {
    const sp = buildSearchParams(params);
    try {
      if (cfg.paths.lookup) {
        const { data } = await api.get(`${cfg.paths.lookup(companyId)}?${sp.toString()}`, {
          signal: params.signal,
          headers: langHeader(),
        });
        return toPageResponse<SelectOption>(data);
      }
      if (!cfg.toOptionFromSummary) {
        throw new Error('lookup(): chybí paths.lookup i toOptionFromSummary fallback');
      }
      const page = await list(companyId, params as any);
      const items = (page.items ?? []).map(cfg.toOptionFromSummary);
      return {
        items,
        page: page.page,
        size: page.size,
        total: page.total,
        totalPages: page.totalPages,
      };
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  }

  async function get(companyId: UUID | string, id: Id, opts?: { signal?: AbortSignal }): Promise<Detail> {
    try {
      const { data } = await api.get<Detail>(cfg.paths.item(companyId, id), {
        signal: opts?.signal,
        headers: langHeader(),
      });
      return data;
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  }

  async function create(companyId: UUID | string, body: CreateReq): Promise<void> {
    try {
      const sanitized = compact<CreateReq>(body);
      await api.post<void>(cfg.paths.base(companyId), sanitized, { headers: langHeader() });
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  }

  async function update(companyId: UUID | string, id: Id, body: UpdateReq): Promise<void> {
    try {
      const sanitized = compact<UpdateReq>(body);
      await api.patch<void>(cfg.paths.item(companyId, id), sanitized, { headers: langHeader() });
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  }

  async function archive(companyId: UUID | string, id: Id): Promise<void> {
    if (!cfg.paths.archive) throw new Error('archive(): paths.archive není definováno');
    try {
      await api.post<void>(cfg.paths.archive(companyId, id), null, { headers: langHeader() });
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  }

  async function unarchive(companyId: UUID | string, id: Id): Promise<void> {
    if (!cfg.paths.unarchive) throw new Error('unarchive(): paths.unarchive není definováno');
    try {
      await api.post<void>(cfg.paths.unarchive(companyId, id), null, { headers: langHeader() });
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  }

  async function remove(companyId: UUID | string, id: Id): Promise<void> {
    const url = cfg.paths.remove ? cfg.paths.remove(companyId, id) : cfg.paths.item(companyId, id);
    try {
      await api.delete<void>(url, { headers: langHeader() });
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  }

  function pagedLookupFetcher(companyId: UUID | string, sort: string | string[] = cfg.defaultSort ?? 'name,asc') {
    return async (q: string, page: number, pageSize: number, signal?: AbortSignal): Promise<OptionsPage> => {
      const resp = await lookup(companyId, { q, page, size: pageSize, sort, signal });
      const options = resp.items ?? [];
      const total = resp.total ?? 0;
      const hasMore = (page + 1) < (resp.totalPages ?? Math.ceil(total / Math.max(1, pageSize)));
      return { options, total, hasMore, nextPage: page + 1 };
    };
  }

  return {
    list,
    lookup,
    get,
    create,
    update,
    archive,
    unarchive,
    remove,
    pagedLookupFetcher,
  };
}
