// src/components/ui/stavbau-ui/datatable-core.ts
import * as React from 'react';
import {
    type ColumnDef as TSColumnDef,
    getCoreRowModel,
    useReactTable,
    flexRender,
    type RowData,
} from '@tanstack/react-table';

export type DataTableColumnDef<TData extends RowData> = {
    id: string;
    header: React.ReactNode;
    accessor?: keyof TData | ((row: TData) => unknown);
    cell?: (row: TData) => React.ReactNode;
    visible?: boolean;
    // arch. příprava (PR 2+):
    sortKey?: string;
    responsive?: { min?: 'sm' | 'md' | 'lg'; hideBelow?: boolean };
};

export type DataTableProps<TData extends RowData> = {
    data: TData[];
    columns: DataTableColumnDef<TData>[];
    keyField: keyof TData | ((row: TData) => string);
    loading?: boolean;
    emptyContent?: React.ReactNode;
    errorContent?: React.ReactNode;
    onRowClick?: (row: TData) => void;
    // toolbar sloty přidáme v PR 4
};

export function useDataTableCore<TData extends RowData>(props: DataTableProps<TData>) {
    const tanColumns = React.useMemo<TSColumnDef<TData>[]>(() => {
        return props.columns.map((c) => {
            const acc = c.accessor;

            let accessorFn: ((row: TData) => unknown) | undefined;
            if (typeof acc === 'function') {
                // ✅ TS vidí 'acc' jako funkci
                accessorFn = (row: TData) => (acc as (row: TData) => unknown)(row);
            } else if (acc != null) {
                // ✅ 'acc' je keyof TData → čtení z objektu
                accessorFn = (row: TData) => (row as any)[acc as keyof TData];
            }

            return {
                id: c.id,
                header: () => c.header,
                accessorFn,
                cell: ({ row, getValue }) =>
                    c.cell ? c.cell(row.original as TData) : String(getValue?.() ?? ''),
                enableHiding: true,
            } as TSColumnDef<TData>;
        });
    }, [props.columns]);

    const table = useReactTable<TData>({
        data: props.data,
        columns: tanColumns,
        getCoreRowModel: getCoreRowModel(),
        // PR 2+: sorting
        // PR 3+: pagination
        // PR 4+: column visibility controlled
    });

    const getRowKey = React.useCallback((row: TData, idx: number) => {
        if (typeof props.keyField === 'function') return props.keyField(row);
        const k = (row as any)[props.keyField as keyof TData];
        return k ? String(k) : `row-${idx}`;
    }, [props.keyField]);

    return { table, flexRender, getRowKey };
}
