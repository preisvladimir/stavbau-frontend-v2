// src/components/ui/stavbau-ui/datatable-core.ts
import * as React from 'react';
import {
    type ColumnDef as TSColumnDef,
    getCoreRowModel,
    getSortedRowModel,        // ← NEW
    type SortingState,             // ← NEW
    useReactTable,
    flexRender,
    type RowData,
} from '@tanstack/react-table';

export type DataTableSort = Array<{ id: string; desc: boolean }>;

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

    // PR2: sorting
    sort?: DataTableSort;                                  // controlled
    onSortChange?: (s: DataTableSort) => void;             // controlled cb
    defaultSort?: DataTableSort;                           // uncontrolled
    enableClientSort?: boolean;                            // default true
};

export function useDataTableCore<TData extends RowData>(props: DataTableProps<TData>) {
    const [internalSort, setInternalSort] = React.useState<SortingState>(props.defaultSort ?? []);
    const sorting = (props.sort ?? internalSort) as SortingState;

    const tanColumns = React.useMemo<TSColumnDef<TData>[]>(() => {
        return props.columns.map((c) => {
            const acc = c.accessor;
            let accessorFn: ((row: TData) => unknown) | undefined;
            if (typeof acc === 'function') accessorFn = (row) => (acc as (r: TData) => unknown)(row);
            else if (acc != null) accessorFn = (row) => (row as any)[acc as keyof TData];

            return {
                id: c.id,
                header: () => c.header,
                accessorFn,
                cell: ({ row, getValue }) => (c.cell ? c.cell(row.original as TData) : String(getValue?.() ?? '')),
                enableHiding: true,
                enableSorting: props.enableClientSort !== false,   // ← allow sort unless disabled
            } as TSColumnDef<TData>;
        });
    }, [props.columns, props.enableClientSort]);

    const table = useReactTable<TData>({
        data: props.data,
        columns: tanColumns,
        state: { sorting },
        onSortingChange: (updater) => {
            const next = typeof updater === 'function' ? updater(sorting) : updater;
            if (props.onSortChange) props.onSortChange(next as DataTableSort);
            else setInternalSort(next as SortingState);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: props.enableClientSort === false ? undefined : getSortedRowModel(),
        // server-side sort: ponecháme onSortChange + parent fetch (bez getSortedRowModel)
    });

    const getRowKey = React.useCallback((row: TData, idx: number) => {
        if (typeof props.keyField === 'function') return props.keyField(row);
        const k = (row as any)[props.keyField as keyof TData];
        return k ? String(k) : `row-${idx}`;
    }, [props.keyField]);

    return { table, flexRender, getRowKey };
}
