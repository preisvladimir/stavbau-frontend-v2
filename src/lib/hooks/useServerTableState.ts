import * as React from 'react';
import type { PageResponse } from '@/types/PageResponse';
import type { DataTableV2Sort } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';

/** Serializer DataTableV2Sort -> ["field,asc","other,desc"] */
export function defaultSerializeSort(sort: DataTableV2Sort | null | undefined): string[] {
  if (!sort || sort.length === 0) return ['createdAt,desc'];
  return sort.map(s => `${s.id},${s.desc ? 'desc' : 'asc'}`);
}

export type ServerTableFetcher<T> = (params: {
  q?: string;
  page?: number;     // 0-based
  size?: number;     // page size
  sort?: string | string[]; // supports multiple ?sort=
}) => Promise<PageResponse<T>>;

export type ServerTableDefaults = {
  q?: string;
  page?: number;
  size?: number;
  sort?: DataTableV2Sort; // initial multi-sort
};

export type UseServerTableStateOptions<T> = {
  /** Povinný fetcher pro konkrétní modul (Projects/Customers/Team). */
  fetcher: ServerTableFetcher<T>;
  /** Výchozí hodnoty (q/page/size/sort). */
  defaults?: ServerTableDefaults;
  /** Max. povolená velikost stránky (ochrana před DoS/UX chybou). Default 100. */
  pageSizeLimit?: number;
  /** Vlastní serializace sortu (jinak default na "field,dir"). */
  serializeSort?: (sort: DataTableV2Sort | null | undefined) => string[];
};

export function useServerTableState<T>(
  opts: UseServerTableStateOptions<T>
) {
  const {
    fetcher,
    defaults,
    pageSizeLimit = 100,
    serializeSort = defaultSerializeSort,
  } = opts;

  // Stabilizuj fetcher přes ref (ochrana před inline arrow funkcí v props)
  const fetcherRef = React.useRef(fetcher);
  React.useEffect(() => { fetcherRef.current = fetcher; }, [fetcher]);

  // ----- controlled state -----
  const [q, setQ] = React.useState<string>(defaults?.q ?? '');
  const [page, setPage] = React.useState<number>(Math.max(0, defaults?.page ?? 0));
  const [size, setSize] = React.useState<number>(Math.min(defaults?.size ?? 20, pageSizeLimit));
  const [sort, setSort] = React.useState<DataTableV2Sort>(
    defaults?.sort ?? [{ id: 'createdAt', desc: true }]
  );

  const [loading, setLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<PageResponse<T>>({
    items: [],
    page: 0,
    size: size,
    total: 0,
  });

  // Pomocné: stabilní klíč pro deps (nejlevnější způsob)
  const sortKey = React.useMemo(() => JSON.stringify(sort), [sort]);
  const depsKey = React.useMemo(() => `${q}|${page}|${size}|${sortKey}`, [q, page, size, sortKey]);

  // Guard: porovná dvě sort pole (abychom nepřepisovali stejnou hodnotu)
  const sortsEqual = (a: DataTableV2Sort, b: DataTableV2Sort) =>
    a.length === b.length && a.every((x, i) => x.id === b[i].id && !!x.desc === !!b[i].desc);

  // ----- loader (shared pro useEffect i refreshy) -----
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetcherRef.current({
        q, page, size, sort: serializeSort(sort),
      });
      setData(res);

      // Edge case: po smazání může být aktuální stránka prázdná, ale existují předchozí stránky
      if (res.items.length === 0 && res.total > 0 && page > 0) {
        setPage(p => Math.max(0, p - 1));
      }
    } finally {
      setLoading(false);
    }
  }, [q, page, size, serializeSort, sortKey]);

  // ----- auto-load na změny parametrů -----
  React.useEffect(() => {
    console.debug('[useServerTableState] load deps changed:', { q, page, size, sort });
    void load();
  }, [depsKey, load]);

  // ----- veřejné utility -----
  const refreshList = React.useCallback(async () => {
    await load(); // zachová page/size/sort/q
  }, [load]);

  const refreshAfterMutation = React.useCallback(async () => {
    // po create/edit typicky chceme na první stránku
    setPage(p => (p === 0 ? 0 : 0)); // idempotentně
    // useEffect zavolá load po změně page; pokud chceš eager, můžeš i: await load();
  }, []);

  // ----- handlery pro DataTableV2 -----
  const onPageChange = React.useCallback((nextPage: number) => {
    setPage(Math.max(0, nextPage));
  }, []);

  const onPageSizeChange = React.useCallback((nextSize: number) => {
    const capped = Math.min(nextSize, pageSizeLimit);
    setSize(capped);
    setPage(0);
  }, [pageSizeLimit]);

  const onSortChange = React.useCallback((next: DataTableV2Sort) => {
    const nextVal = next?.length ? next : [{ id: 'createdAt', desc: true }];
    setSort(prev => (sortsEqual(prev, nextVal) ? prev : nextVal));
    setPage(0);
  }, []);

  const onSearchChange = React.useCallback((val: string) => {
    setQ(prev => (prev === (val ?? '') ? prev : (val ?? '')));
    setPage(0);
  }, []);

  return {
    // stav
    q, page, size, sort, loading, data,
    // mutátory
    setQ, setPage, setSize, setSort,
    // handlery pro tabulku
    onPageChange, onPageSizeChange, onSortChange, onSearchChange,
    // datové akce
    load, refreshList, refreshAfterMutation,
  };
}
