// src/components/ui/stavbau-ui/datatable-v2-core.ts
import * as React from 'react';
import {
  type ColumnDef as TSColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  type RowData,
  getSortedRowModel,
  type SortingState,
  getPaginationRowModel,
  type VisibilityState,
} from '@tanstack/react-table';

export type TableDensity = 'compact' | 'cozy' | 'comfortable';

// --- Filters typy ---
export type FilterValue = string | number | boolean | null | undefined;
export type Filters = Record<string, FilterValue>;

// Volby pro role v toolbaru (Select)
export type ToolbarRoleOption = { value: string; label: React.ReactNode };

export type DataTableV2Column<T extends RowData> = {
  id: string;
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => unknown);
  cell?: (row: T) => React.ReactNode;
  visible?: boolean;
  enableSorting?: boolean;
  meta?: any;
};

export type DataTableV2Sort = Array<{ id: string; desc: boolean }>;

export type DataTableV2Props<T extends RowData> = {
  data: T[];
  columns: DataTableV2Column<T>[];
  keyField: keyof T | ((row: T) => string);
  loading?: boolean;
  emptyContent?: React.ReactNode;
  onRowClick?: (row: T) => void;

  // Sorting (PR2)
  sort?: DataTableV2Sort;
  onSortChange?: (s: DataTableV2Sort) => void;
  defaultSort?: DataTableV2Sort;
  enableClientSort?: boolean; // default true

  // Paging (PR3)
  page?: number;                         // 1-based (controlled)
  pageSize?: number;                     // controlled
  total?: number;                        // required pro server mode
  pageCount?: number;                    // volitelné v server mode
  onPageChange?: (page: number) => void; // 1-based
  onPageSizeChange?: (size: number) => void;
  defaultPage?: number;                  // 1-based (uncontrolled init)
  defaultPageSize?: number;              // uncontrolled init
  enableClientPaging?: boolean;          // default true
  showPager?: boolean;                   // default true

  // Toolbar (PR4)
  search?: string;                           // controlled
  onSearchChange?: (q: string) => void;
  defaultSearch?: string;                    // uncontrolled init
  searchDebounceMs?: number;
  loadingMode?: 'auto' | 'overlay' | 'skeleton';

  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (v: VisibilityState) => void;
  defaultColumnVisibility?: VisibilityState;

  density?: TableDensity;
  onDensityChange?: (d: TableDensity) => void;
  defaultDensity?: TableDensity;

  showToolbar?: boolean;

  onReset?: () => void;
  pageSizeOptions?: number[];

  rowActions?: (row: T) => React.ReactNode;

  variant?: 'surface' | 'plain';
  className?: string;

  i18nNamespaces?: string[];

  // --- Filters (controlled/uncontrolled) ---
  filters?: Filters;
  onFiltersChange?: (next: Filters) => void;
  initialFilters?: Filters;

  // --- NEW: volitelné options pro role filter v toolbaru ---
  roleOptions?: ToolbarRoleOption[];
};

// -- util pro controlled/uncontrolled stav (podpora functional updates) --
function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: T;
  defaultProp: T;
  onChange?: (v: T) => void;
}) {
  const [internal, setInternal] = React.useState<T>(defaultProp);
  const isControlled = prop !== undefined;
  const value = (isControlled ? (prop as T) : internal) as T;

  const setValue = React.useCallback(
    (nextOrUpdater: T | ((prev: T) => T)) => {
      const nextValue =
        typeof nextOrUpdater === 'function'
          ? (nextOrUpdater as (prev: T) => T)(value)
          : nextOrUpdater;

      if (!isControlled) setInternal(nextValue);
      onChange?.(nextValue);
    },
    [isControlled, onChange, value]
  );

  return [value, setValue] as const;
}

export function useDataTableV2Core<T extends RowData>(props: DataTableV2Props<T>) {
  const isServer = props.enableClientPaging === false;
  const warnedNoTotalRef = React.useRef(false);

  // sloupce
  const tanColumns = React.useMemo<TSColumnDef<T>[]>(() => {
    return props.columns.map((c) => {
      const acc = c.accessor;
      let accessorFn: ((row: T) => unknown) | undefined;
      if (typeof acc === 'function') accessorFn = (row) => (acc as (r: T) => unknown)(row);
      else if (acc != null) accessorFn = (row) => (row as any)[acc as keyof T];

      return {
        id: c.id,
        header: () => c.header,
        accessorFn,
        cell: ({ row, getValue }) => (c.cell ? c.cell(row.original as T) : String(getValue?.() ?? '')),
        enableHiding: true,
        enableSorting: c.enableSorting ?? true,   // ⬅ UI šipky zapnuté i v server módu
        meta: c.meta,
      } as TSColumnDef<T>;
    });
  }, [props.columns, props.enableClientSort]);

  // ---- Sorting (PR2) ----
  const [internalSort, setInternalSort] = React.useState<SortingState>(props.defaultSort ?? []);
  const sorting = (props.sort ?? internalSort) as SortingState;

  // ---- Paging (PR3) ----
  const initialPageIndex = Math.max(0, (props.defaultPage ?? 1) - 1);
  const initialPageSize = props.defaultPageSize ?? props.pageSize ?? 10;

  const controlledPageIndex = props.page != null ? Math.max(0, props.page - 1) : undefined;
  const controlledPageSize = props.pageSize;

  const [internalPageIndex, setInternalPageIndex] = React.useState<number>(initialPageIndex);
  const [internalPageSize, setInternalPageSize] = React.useState<number>(initialPageSize);

  const pageIndex = controlledPageIndex ?? internalPageIndex;
  const pageSize = controlledPageSize ?? internalPageSize;

  // Track: první dokončené načtení → teprve pak povol klampování
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  React.useEffect(() => {
    if (!props.loading) setHasLoadedOnce(true);
  }, [props.loading]);

  // total (client vs server)
  let total: number = props.data.length;
  if (isServer) {
    if (typeof props.total === 'number') {
      total = props.total!;
    } else {
      if (process.env.NODE_ENV !== 'production' && !props.loading && !warnedNoTotalRef.current) {
        console.warn('[DataTableV2] Server paging bez props.total – fallback na data.length (nepřesné).');
        warnedNoTotalRef.current = true;
      }
      total = props.data.length;
    }
    if (process.env.NODE_ENV !== 'production' && props.page === 0) {
      console.warn('[DataTableV2] Prop "page" je 1-based. Neposílej 0.');
    }
  }

  // Stabilita pageCount:
  // - dokud NEMÁME hasLoadedOnce (nebo běží loading), nebo je total neznámý (0 a prázdná stránka),
  //   drž minimální pageCount tak, aby nikdy nebyl < (pageIndex+1) → žádný předčasný clamp.
  const basePageCount = Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)));
  const totalLooksUnknown = isServer && (props.pageCount == null) && (total === 0) && (props.data.length === 0);
  const isUncertain = isServer && (!hasLoadedOnce || props.loading || totalLooksUnknown);
  const derivedPageCount = isUncertain ? Math.max(basePageCount, pageIndex + 1) : basePageCount;
  const pageCount = props.pageCount || derivedPageCount;

  // ---- Search (PR4) ----
  const [internalSearch, setInternalSearch] = React.useState(props.defaultSearch ?? '');
  const search = props.search ?? internalSearch;
  const setSearch = (q: string) => (props.onSearchChange ? props.onSearchChange(q) : setInternalSearch(q));

  // ---- Column visibility (PR4) ----
  const [internalVisibility, setInternalVisibility] = React.useState<VisibilityState>(
    props.defaultColumnVisibility ?? {}
  );
  const visibility = props.columnVisibility ?? internalVisibility;

  // ---- Density (PR4) ----
  const [internalDensity, setInternalDensity] = React.useState<TableDensity>(props.defaultDensity ?? 'cozy');
  const density = props.density ?? internalDensity;
  const setDensity = (d: TableDensity) =>
    props.onDensityChange ? props.onDensityChange(d) : setInternalDensity(d);

  // ---- Filters (PR6) ----
  const [filters, setFilters] = useControllableState<Filters>({
    prop: props.filters,
    defaultProp: props.initialFilters ?? {},
    onChange: props.onFiltersChange,
  });

  const setFilter = React.useCallback(
    (key: string, value: FilterValue) =>
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (next[key] === '' || next[key] === null || next[key] === undefined) {
          delete next[key];
        }
        return next;
      }),
    [setFilters]
  );

  const resetFilters = React.useCallback(() => setFilters({}), [setFilters]);

  const table = useReactTable<T>({
    data: props.data,
    columns: tanColumns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      columnVisibility: visibility,
    },
    manualPagination: isServer,                         // server řídí stránkování
    manualSorting: props.enableClientSort === false,    // server řídí řazení
    autoResetPageIndex: false,                          // ⬅️ klíčové: žádné auto-0 po mountu/sortu
    //autoResetSorting: false,                            // nedráždit resetem sortu    
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      if (props.onSortChange) props.onSortChange(next as DataTableV2Sort);
      else setInternalSort(next as SortingState);
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === 'function' ? updater(visibility) : updater;
      if (props.onColumnVisibilityChange) props.onColumnVisibilityChange(next);
      else setInternalVisibility(next);
    },
    onPaginationChange: (updater) => {
      const prev = { pageIndex, pageSize };
      const next = typeof updater === 'function' ? updater(prev) : updater;

      const clampedIndex = Math.min(Math.max(0, next.pageIndex), Math.max(0, pageCount - 1));

      if (clampedIndex !== prev.pageIndex) {
        props.onPageChange ? props.onPageChange(clampedIndex + 1) : setInternalPageIndex(clampedIndex);
      }
      if (next.pageSize !== prev.pageSize) {
        props.onPageSizeChange ? props.onPageSizeChange(next.pageSize) : setInternalPageSize(next.pageSize);
        const resetIndex = 0;
        if (props.onPageChange) props.onPageChange(1);
        else setInternalPageIndex(resetIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: props.enableClientSort === false ? undefined : getSortedRowModel(),
    getPaginationRowModel: isServer ? undefined : getPaginationRowModel(),
    pageCount,
  });

  const getRowKey = React.useCallback(
    (row: T, idx: number) => {
      if (typeof props.keyField === 'function') return props.keyField(row);
      const k = (row as any)[props.keyField as keyof T];
      return k ? String(k) : `row-${idx}`;
    },
    [props.keyField]
  );

  // Mobile-first density
  const densityMap = {
    compact: { th: 'px-2 py-1 text-xs', td: 'px-2 py-1 text-xs' },
    cozy: { th: 'px-3 py-2 text-xs lg:py-1.5 xl:py-2', td: 'px-3 py-2 text-sm lg:py-1.5 xl:py-2' },
    comfortable: {
      th: 'px-4 py-3 text-sm md:py-3 lg:py-2.5 xl:py-1.5',
      td: 'px-4 py-3 text-base md:py-3 lg:py-2.5 xl:py-1.5',
    },
  } as const;

  const densityClasses = densityMap[density];

  // Guard clamp: povolit až po prvním dokončeném načtení a když už víme rozsah
  React.useEffect(() => {
    if (isServer && isUncertain) return;
    const maxIndex = Math.max(0, pageCount - 1);
    if (pageIndex > maxIndex) {
      if (props.onPageChange) props.onPageChange(maxIndex + 1);
      else table.setPageIndex(maxIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount, isServer, isUncertain]);

  // exposed helpers (1-based page)
  const api = {
    page: pageIndex + 1,
    pageSize,
    pageCount,
    total,
    setPage: (p: number) => table.setPageIndex(Math.max(0, p - 1)),
    setPageSize: (s: number) => {
      const size = Math.max(1, s);
      table.setPageSize(size);
      table.setPageIndex(0);
    },
    nextPage: () => table.nextPage(),
    prevPage: () => table.previousPage(),
    canNextPage: table.getCanNextPage(),
    canPrevPage: table.getCanPreviousPage(),
    gotoPage: (p: number) => {
      const safe = Math.max(1, Math.min(p, pageCount));
      table.setPageIndex(safe - 1);
    },

    // Filters API pro parent/toolbar
    filters,
    setFilter,
    resetFilters,
  };

  // Kompletní reset toolbar stavů
  const resetAll = () => {
    table.resetSorting();
    table.resetColumnVisibility();
    table.setPageIndex(0);
    table.setPageSize(props.defaultPageSize ?? pageSize);
    setDensity(props.defaultDensity ?? 'cozy');
    setSearch(props.defaultSearch ?? '');
    resetFilters();
    props.onReset?.();
  };

  return {
    table,
    flexRender,
    getRowKey,
    api,

    // PR4 exposes
    search,
    setSearch,
    density,
    setDensity,
    densityClasses,
    resetAll,
    pageSizeOptions: props.pageSizeOptions ?? [5, 10, 20],

    // Filters i „napřímo“ (mimo api)
    filters,
    setFilter,
    resetFilters,
  };
}
