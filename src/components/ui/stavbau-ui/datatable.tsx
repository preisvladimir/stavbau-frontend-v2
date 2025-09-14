import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type ColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  width?: string;     // Tailwind třídy (např. "w-40")
  align?: "left" | "center" | "right";
  cellClass?: string;
  sortable?: boolean; // pro budoucí sort UI
  selectable?: boolean;
  accessor?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  keyField,
  loading,
  empty,
  className,
  onRowClick,
}: {
  columns: ColumnDef<T>[];
  data: T[];
  keyField: (row: T) => React.Key;
  loading?: boolean;
  empty?: React.ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
}) {
  const colCount = columns.length;

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-[rgb(var(--sb-border))] bg-[rgb(var(--sb-surface))]",
        className
      )}
      role="region"
      aria-label="Data table"
    >
      <table className="sb-table w-full border-collapse">
        <thead className="bg-white">
          <tr className="text-left text-[rgb(var(--sb-muted))]">
            {columns.map((c) => (
              <th
                key={c.id}
                className={cn("px-3 py-2 text-sm font-medium", c.width)}
                scope="col"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="px-3 py-8 text-center text-[rgb(var(--sb-muted))]" colSpan={colCount}>
                Načítám…
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td className="px-3 py-6" colSpan={colCount}>
                {empty}
              </td>
            </tr>
          ) : (
            data.map((r) => (
              <tr
                key={keyField(r)}
                className={cn(
                  "bg-white even:bg-[rgb(var(--sb-surface))]",
                  onRowClick && "cursor-pointer hover:bg-slate-50"
                )}
                onClick={() => onRowClick?.(r)}
              >
                {columns.map((c) => (
                  <td
                    key={c.id}
                    className={cn(
                      "px-3 py-2 text-sm text-[rgb(var(--sb-fg))]",
                      c.width,
                      c.cellClass,
                      c.align === "center" && "text-center",
                      c.align === "right" && "text-right"
                    )}
                  >
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
