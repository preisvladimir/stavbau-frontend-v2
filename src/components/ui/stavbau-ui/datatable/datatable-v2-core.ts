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
  /**
   * Debounce (v ms) pro změny vyhledávání. Default: 250 ms.
   * Debounce probíhá v DataTableV2 a do onSearchChange se posílá až „ustálená“ hodnota.
   */
  searchDebounceMs?: number;
  /**
   * Způsob zobrazení načítání:
   * - 'auto' (default): skeleton při initial load, overlay při dalších loadech
   * - 'overlay': vždy overlay
   * - 'skeleton': vždy skeleton
   */
  loadingMode?: 'auto' | 'overlay' | 'skeleton';

  columnVisibility?: VisibilityState;        // controlled { [columnId]: boolean }
  onColumnVisibilityChange?: (v: VisibilityState) => void;
  defaultColumnVisibility?: VisibilityState; // uncontrolled init

  density?: TableDensity;
  onDensityChange?: (d: TableDensity) => void;
  defaultDensity?: TableDensity;

  showToolbar?: boolean; // default true

  /** Toolbar: page size options for selector (PR 4.1) */
  onReset?: () => void;
  pageSizeOptions?: number[]; // výběr velikosti stránky (default [5,10,20])

  // Row actions (PR 5)
  rowActions?: (row: T) => React.ReactNode;

  /** Vizuální varianta vzhledu tabulky */
  variant?: 'surface' | 'plain'; // default: 'plain'

  /** Volitelná třída na wrapperu tabulky */
  className?: string;

  /**
   * i18n namespaces, které mají používat mobilní karty (DataRowCard)
   * Příklad: ['team', 'common'] nebo ['invoices', 'common']
   * Pokud není uvedeno, použije se ['common'].
   */
  i18nNamespaces?: string[];

  // --- Filters (controlled/uncontrolled) ---
  filters?: Filters;                         // controlled
  onFiltersChange?: (next: Filters) => void; // callback pro controlled režim
  initialFilters?: Filters;                  // default pro uncontrolled

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
        enableSorting: props.enableClientSort !== false,
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

  // Page count: client ↔ server
  const total =
    props.enableClientPaging === false && typeof props.total === 'number'
      ? props.total
      : props.data.length;
  const pageCount = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));

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
        // očista prázdných hodnot – menší payload/URL
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
      // Filtry držíme mimo TanStack a používáme je v parent/server vrstvě.
    },
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
      if (next.pageIndex !== prev.pageIndex) {
        props.onPageChange ? props.onPageChange(next.pageIndex + 1) : setInternalPageIndex(next.pageIndex);
      }
      if (next.pageSize !== prev.pageSize) {
        props.onPageSizeChange ? props.onPageSizeChange(next.pageSize) : setInternalPageSize(next.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: props.enableClientSort === false ? undefined : getSortedRowModel(),
    getPaginationRowModel: props.enableClientPaging === false ? undefined : getPaginationRowModel(), // client-only
    pageCount, // i pro server mode – TanStack ví o limitu
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

  // exposed helpers (1-based page)
  const api = {
    page: pageIndex + 1,
    pageSize,
    pageCount,
    total,
    setPage: (p: number) => table.setPageIndex(Math.max(0, p - 1)),
    setPageSize: (s: number) => {
      const size = Math.max(1, s);
      // 1) nastavit velikost stránky
      table.setPageSize(size);
      // 2) pro jistotu skočit na první stránku (0-based)
      table.setPageIndex(0);
      // Pozn.: naše onPaginationChange zajistí zavolání
      // props.onPageSizeChange(size) a props.onPageChange(1)
    },
    nextPage: () => table.nextPage(),
    prevPage: () => table.previousPage(),
    canNextPage: table.getCanNextPage(),
    canPrevPage: table.getCanPreviousPage(),
    /** Přímý skok na stránku (1-based). Ořízne mimo rozsah 1..pageCount. */
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

    // Filters i „napřímo“ (mimo api), pokud se hodí v komponentě
    filters,
    setFilter,
    resetFilters,
  };
}
