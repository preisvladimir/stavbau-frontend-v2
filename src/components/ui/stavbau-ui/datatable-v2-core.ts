import * as React from 'react';
import {
  type ColumnDef as TSColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  type RowData,
} from '@tanstack/react-table';

export type DataTableV2Column<T extends RowData> = {
  id: string;
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => unknown);
  cell?: (row: T) => React.ReactNode;
  visible?: boolean;
};

export type DataTableV2Props<T extends RowData> = {
  data: T[];
  columns: DataTableV2Column<T>[];
  keyField: keyof T | ((row: T) => string);
  loading?: boolean;
  emptyContent?: React.ReactNode; // default fallback v UI
  onRowClick?: (row: T) => void;
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
      } as TSColumnDef<T>;
    });
  }, [props.columns]);

  const table = useReactTable<T>({
    data: props.data,
    columns: tanColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const getRowKey = React.useCallback((row: T, idx: number) => {
    if (typeof props.keyField === 'function') return props.keyField(row);
    const k = (row as any)[props.keyField as keyof T];
    return k ? String(k) : `row-${idx}`;
  }, [props.keyField]);

  return { table, flexRender, getRowKey };
}
