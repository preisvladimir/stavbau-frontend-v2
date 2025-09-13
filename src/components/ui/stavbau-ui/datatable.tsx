import * as React from "react";
import clsx from "clsx";

export type ColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  width?: string;
  align?: string;
  cellClass?: string;
  sortable?: boolean;
  selectable?: boolean;
  accessor?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  columns, data, keyField, loading, empty, className, onRowClick,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  keyField: (row: T) => React.Key;
  loading?: boolean;
  empty?: React.ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className={clsx("overflow-x-auto rounded-xl border border-[rgb(var(--sb-border))] bg-[rgb(var(--sb-surface))]", className)}>
      <table className="sb-table">
        <thead>
          <tr className="text-[rgb(var(--sb-muted))] text-left">
            {columns.map(c => (
              <th key={c.id} className={clsx(c.width)}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td className="px-3 py-8 text-center text-[rgb(var(--sb-muted))]" colSpan={columns.length}>Načítám…</td></tr>
          ) : data.length === 0 ? (
            <tr><td className="px-3 py-6" colSpan={columns.length}>{empty}</td></tr>
          ) : (
            data.map(r => (
              <tr key={keyField(r)} className={clsx(onRowClick && "cursor-pointer")} onClick={() => onRowClick?.(r)}>
                {columns.map(c => (
                  <td key={c.id} className={clsx(c.width)}>
                    {c.cell ? c.cell(r) : c.accessor ? c.accessor(r) : null}
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
