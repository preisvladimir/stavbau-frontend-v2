// PATCH: datatable-v2-core.ts
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

export type TableDensity = "compact" | "cozy" | "comfortable";

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

  columnVisibility?: VisibilityState;        // controlled { [columnId]: boolean }
  onColumnVisibilityChange?: (v: VisibilityState) => void;
  defaultColumnVisibility?: VisibilityState; // uncontrolled init

  density?: TableDensity;
  onDensityChange?: (d: TableDensity) => void;
  defaultDensity?: TableDensity;

  showToolbar?: boolean;                     // default true  

    /** Toolbar: page size options for selector (PR 4.1) */
  onReset?: () => void;
  pageSizeOptions?: number[]; // výběr velikosti stránky (default [5,10,20])

  // Row actions (PR 5)
  rowActions?: (row: T) => React.ReactNode;

    /** Vizuální varianta vzhledu tabulky */
  variant?: 'surface' | 'plain'; // default: 'plain'

  /** Volitelná třída na wrapperu tabulky */
  className?: string;
};

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
  const total = props.enableClientPaging === false && typeof props.total === 'number'
    ? props.total
    : props.data.length;
  const pageCount = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));

  // ---- PR4: search (zatím jen prop, filtr necháme na parentu v PR 4.2) ----
  const [internalSearch, setInternalSearch] = React.useState(props.defaultSearch ?? '');
  const search = props.search ?? internalSearch;
  const setSearch = (q: string) => (props.onSearchChange ? props.onSearchChange(q) : setInternalSearch(q));

  // ---- PR4: column visibility ----
  const [internalVisibility, setInternalVisibility] = React.useState<VisibilityState>(props.defaultColumnVisibility ?? {});
  const visibility = props.columnVisibility ?? internalVisibility;

  // ---- PR4: density ----
  const [internalDensity, setInternalDensity] = React.useState<TableDensity>(props.defaultDensity ?? 'cozy');
  const density = props.density ?? internalDensity;
  const setDensity = (d: TableDensity) => (props.onDensityChange ? props.onDensityChange(d) : setInternalDensity(d));



  const table = useReactTable<T>({
    data: props.data,
    columns: tanColumns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      columnVisibility: visibility,
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
      // 0-based → 1-based callbacky
      if (next.pageIndex !== prev.pageIndex) {
        props.onPageChange
          ? props.onPageChange(next.pageIndex + 1)
          : setInternalPageIndex(next.pageIndex);
      }
      if (next.pageSize !== prev.pageSize) {
        props.onPageSizeChange
          ? props.onPageSizeChange(next.pageSize)
          : setInternalPageSize(next.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: props.enableClientSort === false ? undefined : getSortedRowModel(),
    getPaginationRowModel: props.enableClientPaging === false ? undefined : getPaginationRowModel(), // client-only
    pageCount, // i pro server mode, aby TanStack věděl limit
  });

  const getRowKey = React.useCallback((row: T, idx: number) => {
    if (typeof props.keyField === 'function') return props.keyField(row);
    const k = (row as any)[props.keyField as keyof T];
    return k ? String(k) : `row-${idx}`;
  }, [props.keyField]);

  const densityClasses = {
    compact: { th: 'px-2 py-1 text-xs', td: 'px-2 py-1 text-xs' },
    cozy: { th: 'px-3 py-2 text-xs', td: 'px-3 py-2 text-sm' },
    comfortable: { th: 'px-4 py-3 text-sm', td: 'px-4 py-3 text-base' },
  }[density];

  // exposed helpers (1-based page)
  const api = {
    page: pageIndex + 1,
    pageSize,
    pageCount,
    total,
    setPage: (p: number) => table.setPageIndex(Math.max(0, p - 1)),
    setPageSize: (s: number) => table.setPageSize(Math.max(1, s)),   // ← NEW
    nextPage: () => table.nextPage(),
    prevPage: () => table.previousPage(),
    canNextPage: table.getCanNextPage(),
    canPrevPage: table.getCanPreviousPage(),
  };

    // ← NEW helper: úplný reset toolbar stavů
  const resetAll = () => {
    table.resetSorting();
    table.resetColumnVisibility();
    table.setPageIndex(0);
    table.setPageSize(props.defaultPageSize ?? pageSize);
    setDensity(props.defaultDensity ?? 'cozy');
    setSearch(props.defaultSearch ?? '');
    props.onReset?.();
  };

  return {
    table, flexRender, getRowKey,
    api,
    // PR4 exposes
    search, setSearch,
    density, setDensity, densityClasses, resetAll,
    pageSizeOptions: props.pageSizeOptions ?? [5, 10, 20],
  };
}
