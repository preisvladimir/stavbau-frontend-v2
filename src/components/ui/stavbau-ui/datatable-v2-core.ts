import * as React from 'react';
import {
  type ColumnDef as TSColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  type RowData,
  getSortedRowModel,   // ← NEW
  type SortingState,        // ← NEW
} from '@tanstack/react-table';

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

  // PR2: sorting
  sort?: DataTableV2Sort;                           // controlled stav
  onSortChange?: (s: DataTableV2Sort) => void;      // controlled callback
  defaultSort?: DataTableV2Sort;                    // uncontrolled výchozí
  enableClientSort?: boolean;                       // default = true
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
        enableSorting: props.enableClientSort !== false, // sorting povolen, pokud není vypnuto
      } as TSColumnDef<T>;
    });
  }, [props.columns, props.enableClientSort]);

  // ---- PR2: controlled/uncontrolled sorting stav ----
  const [internalSort, setInternalSort] = React.useState<SortingState>(props.defaultSort ?? []);
  const sorting = (props.sort ?? internalSort) as SortingState;  

  const table = useReactTable<T>({
    data: props.data,
    columns: tanColumns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      if (props.onSortChange) props.onSortChange(next as DataTableV2Sort);
      else setInternalSort(next as SortingState);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: props.enableClientSort === false ? undefined : getSortedRowModel(),
  });

  const getRowKey = React.useCallback((row: T, idx: number) => {
    if (typeof props.keyField === 'function') return props.keyField(row);
    const k = (row as any)[props.keyField as keyof T];
    return k ? String(k) : `row-${idx}`;
  }, [props.keyField]);

  return { table, flexRender, getRowKey };
}
