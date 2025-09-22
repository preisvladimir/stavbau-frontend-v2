import { useDataTableV2Core, type DataTableV2Props } from './datatable-v2-core';
import { cn } from '@/lib/utils/cn';
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate';

export function DataTableV2<T>(props: DataTableV2Props<T>) {
  const { table, flexRender, getRowKey } = useDataTableV2Core(props);
  const isEmpty = !props.loading && props.data.length === 0;

  return (
    <div className="w-full overflow-x-auto">
      <table role="table" className={cn('w-full text-left border-separate border-spacing-0', 'min-w-[640px]')}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} scope="col" className="px-3 py-2 text-xs font-semibold text-foreground/80">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {props.loading ? (
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
                {props.emptyContent ?? <EmptyState title="Žádná data" description="Zkuste upravit filtr nebo přidat záznam." />}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, idx) => (
              <tr
                key={getRowKey(row.original as T, idx)}
                className={cn('hover:bg-muted/40', props.onRowClick && 'cursor-pointer')}
                onClick={props.onRowClick ? () => props.onRowClick!(row.original as T) : undefined}
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

export default DataTableV2;
