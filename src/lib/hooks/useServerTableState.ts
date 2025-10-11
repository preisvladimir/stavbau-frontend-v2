import * as React from 'react';
import type { PageResponse } from '@/lib/api/types/PageResponse';
import type { DataTableV2Sort } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';

/** Serializer DataTableV2Sort -> ["field,asc","other,desc"] */
export function defaultSerializeSort(sort: DataTableV2Sort | null | undefined): string[] {
  if (!sort || sort.length === 0) return ['createdAt,desc'];
  return sort.map(s => `${s.id},${s.desc ? 'desc' : 'asc'}`);
}

/** Stabilní JSON.stringify – seřadí klíče pro deterministické porovnání */
function stableStringify(obj: unknown): string {
  const seen = new WeakSet<object>();
  const replacer = (_key: string, value: any) => {
    if (value && typeof value === 'object') {
      if (seen.has(value)) return;
      seen.add(value);
      if (!Array.isArray(value)) {
        return Object.keys(value).sort().reduce((acc: any, k) => {
          acc[k] = value[k];
          return acc;
        }, {});
      }
    }
    return value;
  };
  try {
    return JSON.stringify(obj, replacer);
  } catch {
    // nouzově – když by stringify selhal, vrať prázdný string (nezpůsobí smyčku)
    return '';
  }
}

export type ServerTableFetcher<T, F = Record<string, unknown>> = (params: {
  q?: string;
  page?: number;     // 0-based
  size?: number;     // page size
  sort?: string | string[]; // supports multiple ?sort=
  filters?: F;       // ⬅️ přímý průchod filtrů do fetcheru
  signal?: AbortSignal;
}) => Promise<PageResponse<T>>;

export type ServerTableDefaults = {
  q?: string;
  page?: number;
  size?: number;
  sort?: DataTableV2Sort; // initial multi-sort
};

export type UseServerTableStateOptions<T, F = Record<string, unknown>> = {
  /** Povinný fetcher pro konkrétní modul (Projects/Customers/Team). */
  fetcher: ServerTableFetcher<T, F>;
  /** Výchozí hodnoty (q/page/size/sort + filters). */
  defaults?: ServerTableDefaults & { filters?: F };
  /** Max. povolená velikost stránky (ochrana před DoS/UX chybou). Default 100. */
  pageSizeLimit?: number;
  /** Vlastní serializace sortu (jinak default na "field,dir"). */
  serializeSort?: (sort: DataTableV2Sort | null | undefined) => string[];
  /**
   * Volitelný custom comparator filtrů (pokud nestačí shallow/JSON).
   * Vrací true, když jsou filtry ekvivalentní (neprovádět setState).
   */
  compareFilters?: (a: F, b: F) => boolean;
  /** Volitelný centralizovaný error handler (např. toast). */
  onError?: (e: unknown) => void;
};

export function useServerTableState<T, F = Record<string, unknown>>(
  opts: UseServerTableStateOptions<T, F>
) {
  const {
    fetcher,
    defaults,
    pageSizeLimit = 100,
    serializeSort = defaultSerializeSort,
    compareFilters,
    onError,
  } = opts;

  // Zapamatuj si inicializační (modulový) default sort jako stabilní fallback.
  const initialSortRef = React.useRef<DataTableV2Sort>(
    defaults?.sort ?? [{ id: 'createdAt', desc: true }]
  );

  // Stabilizuj fetcher přes ref (ochrana před inline arrow funkcí v props)
  const fetcherRef = React.useRef(fetcher);
  React.useEffect(() => { fetcherRef.current = fetcher; }, [fetcher]);

  // ----- controlled state -----
  const [q, setQ] = React.useState<string>(defaults?.q ?? '');
  const [page, setPage] = React.useState<number>(Math.max(0, defaults?.page ?? 0));
  const [size, setSize] = React.useState<number>(Math.min(defaults?.size ?? 20, pageSizeLimit));
  const [sort, setSort] = React.useState<DataTableV2Sort>(initialSortRef.current);
  /** NEW: řízené filtry (generické) */
  const [filters, setFilters] = React.useState<F>((defaults?.filters as F) ?? ({} as F));

  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<PageResponse<T>>({
    items: [],
    page: 0,
    size: size,
    total: 0,
  });

  // Abort předchozího requestu + použij jen poslední odpověď
  const abortRef = React.useRef<AbortController | null>(null);
  const seqRef = React.useRef(0);

  // Jednoduchý detektor zrušených requestů (bez závislosti na axios)
  const isCanceled = (e: any) =>
    e?.name === 'AbortError' || e?.code === 'ERR_CANCELED' || e?.__CANCEL__ === true;

  // Rozumné odvození zprávy pro UI
  const messageFromError = (e: any): string =>
    e?.response?.data?.detail ??
    e?.response?.data?.title ??
    e?.message ??
    'Operation failed';

  // Pomocné: stabilní klíče pro deps
  const sortKey = React.useMemo(() => JSON.stringify(sort), [sort]);
  const filtersKey = React.useMemo(() => stableStringify(filters), [filters]);
  const depsKey = React.useMemo(
    () => `${q}|${page}|${size}|${sortKey}|${filtersKey}`,
    [q, page, size, sortKey, filtersKey]
  );

  // Guard: porovná dvě sort pole (abychom nepřepisovali stejnou hodnotu)
  const sortsEqual = (a: DataTableV2Sort, b: DataTableV2Sort) =>
    a.length === b.length && a.every((x, i) => x.id === b[i].id && !!x.desc === !!b[i].desc);

  // Optional guard: porovnání filtrů (custom vs. default JSON)
  const filtersEqual = React.useCallback(
    (a: F, b: F) => (compareFilters ? compareFilters(a, b) : stableStringify(a) === stableStringify(b)),
    [compareFilters]
  );

  // ----- loader (shared pro useEffect i refreshy) -----
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    // zruš předchozí request (StrictMode mount double-run)
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const mySeq = ++seqRef.current;
    try {
      const res = await fetcherRef.current({
        q,
        page,
        size,
        sort: serializeSort(sort),
        filters,
        // pokud tvůj fetcher umí signal (fetch/axios), předej dál:
        signal: (ac as any).signal,
      });
      if (ac.signal.aborted || mySeq !== seqRef.current) return; // ignoruj staré odpovědi
      setData(res);

      // Edge case: po smazání může být aktuální stránka prázdná, ale existují předchozí stránky
      const resTotal =
        (res as any)?.total ??
        (res as any)?.totalElements ??
        0;
      if (res.items.length === 0 && resTotal > 0 && page > 0) {
        setPage(p => Math.max(0, p - 1));
      }
    } catch (e) {
      if (isCanceled(e) || (e as any)?.name === 'AbortError') return;
      const msg = messageFromError(e);
      setError(msg);                       // ulož do centrálního stavu
      onError?.(e);                        // volitelně předej dál (toast apod.)      
    } finally {
      setLoading(false);
    }
  }, [q, page, size, serializeSort, sortKey, filtersKey]); // závislosti přes klíče

  // ----- auto-load na změny parametrů -----
  React.useEffect(() => {
    void load();
  }, [depsKey, load]);

  // ----- veřejné utility -----
  const refreshList = React.useCallback(async () => {
    await load(); // zachová page/size/sort/q/filters
  }, [load]);

  const refreshAfterMutation = React.useCallback(async () => {
    // po create/edit typicky chceme na první stránku
    setPage(0);
    // useEffect zavolá load po změně page; případně lze doplnit await load();
  }, []);

  // ----- handlery pro DataTableV2 -----
  const onPageChange = React.useCallback((nextPage1: number) => {
    // DataTableV2 volá onPageChange s 1-based indexem → převedeme na 0-based
    const next0 = Math.max(0, (nextPage1 ?? 1) - 1);
    setPage(next0);
  }, []);

  const onPageSizeChange = React.useCallback((nextSize: number) => {
    const capped = Math.min(nextSize, pageSizeLimit);
    setSize(capped);
    setPage(0);
  }, [pageSizeLimit]);

 const onSortChange = React.useCallback((next: DataTableV2Sort) => {
   const nextVal = next?.length ? next : initialSortRef.current;
   setSort(prev => {
     const changed = !sortsEqual(prev, nextVal);
     if (changed) setPage(0);       // reset jen při skutečné změně
     return changed ? nextVal : prev;
   });
 }, [sortsEqual]);

  const onSearchChange = React.useCallback((val: string) => {
    setQ(prev => (prev === (val ?? '') ? prev : (val ?? '')));
    setPage(0);
  }, []);

  /** NEW: handler na změnu filtrů (resetuje page) */
  const onFiltersChange = React.useCallback((next: F) => {
    setFilters(prev => (filtersEqual(prev, next) ? prev : next));
    setPage(0);
  }, [filtersEqual]);

  /** NEW: pohodlný patch update – jen mění vybrané klíče */
  const updateFilters = React.useCallback((patch: Partial<F>) => {
    setFilters(prev => {
      const merged = { ...(prev as any), ...(patch as any) } as F;
      return filtersEqual(prev, merged) ? prev : merged;
    });
    setPage(0);
  }, [filtersEqual]);

  /** Vyčistění chyby, např. při zavření alertu */
  const clearError = React.useCallback(() => setError(null), []);

  // Pohodlné 1-based zrcadlo pro spotřebu v UI (pokud nechceš používat asTableProps)
  const page1 = page + 1;

  // Unified total: preferuj data.total, fallback na data.totalElements
  const total =
    (data as any)?.total ??
    (data as any)?.totalElements ??
    0;

  // Helper: namapuje stav hooku na props pro DataTableV2 (server paging)
  // Použij v komponentě: <DataTableV2 {...asTableProps()} />
  const asTableProps = React.useCallback(() => ({
    enableClientPaging: false as const,
    data: data.items,
    total: total,
    page: page1,          // 1-based
    pageSize: size,
    onPageChange,
    onPageSizeChange,
    // Sorting (pokud používáš DataTableV2 sort UI)
    sort,
    onSortChange,
    // Toolbar search
    search: q,
    onSearchChange,
    // Filtry
    filters,
    onFiltersChange,
    loading,
  }), [data.items, total, page1, size, onPageChange, onPageSizeChange, sort, onSortChange, q, onSearchChange, filters, onFiltersChange, loading]);

  return {
    // stav
    q, page, page1, size, total, sort, filters, loading, data, error,
    // mutátory
    setQ, setPage, setSize, setSort, setFilters,
    // handlery pro tabulku
    onPageChange, onPageSizeChange, onSortChange, onSearchChange, onFiltersChange,
    // datové akce
    load, refreshList, refreshAfterMutation,
    // helper pro postupné změny filtrů
    updateFilters,
    // error utility
    clearError,
    // přímé props pro DataTableV2 (server mód)
    asTableProps,
  };
}
