// src/components/ui/stavbau-ui/datatable.tsx
import { useTranslation } from 'react-i18next';
import { useDataTableCore, type DataTableProps } from './datatable-core';
import { cn } from '@/lib/utils/cn'; // existující util
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate'; // dle UI kitu

export function DataTable<TData>(props: DataTableProps<TData>) {
  const { t } = useTranslation();
  const { table, flexRender, getRowKey } = useDataTableCore(props);

  const isEmpty = !props.loading && props.data.length === 0;

  return (
    <div className="w-full overflow-x-auto">
      <table
        role="table"
        className={cn(
          'w-full text-left border-separate border-spacing-0',
          'min-w-[640px]', // prevence rozpadnutí na velmi úzkých viewp.
        )}
      >
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className={cn('px-3 py-2 text-xs font-semibold text-foreground/80')}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {props.loading ? (
            // Skeleton řádky (3x) – držíme sloupcový layout
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={`sk-${i}`} className="animate-pulse">
                {table.getAllColumns().map((c) => (
                  <td key={c.id} className="px-3 py-3">
                    <div className="h-4 w-24 rounded bg-muted" />
                  </td>
                ))}
              </tr>
            ))
          ) : isEmpty ? (
            <tr>
              <td colSpan={table.getAllColumns().length} className="px-3 py-6">
                {props.emptyContent ?? (
                  <EmptyState
                    title={t('datatable.empty.title', 'Žádná data')}
                    description={t('datatable.empty.desc', 'Zkuste upravit filtr nebo přidat novou položku.')}
                  />
                )}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, idx) => (
              <tr
                key={getRowKey(row.original as TData, idx)}
                className={cn('hover:bg-muted/40 cursor-default')}
                onClick={props.onRowClick ? () => props.onRowClick!(row.original as TData) : undefined}
                tabIndex={props.onRowClick ? 0 : -1}
                aria-label={props.onRowClick ? 'Row clickable' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
