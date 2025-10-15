import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type ColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  /** Tailwind šířka sloupce: např. "w-12", "min-w-[200px]" */
  width?: string;
  /** Zarovnání: "text-left|center|right" */
  align?: "text-left" | "text-center" | "text-right";
  /** Extra třídy pro buňku */
  cellClass?: string;
  /** (rezervováno) označení, že sloupec lze třídit */
  sortable?: boolean;
  /** (rezervováno) sloupec obsahuje výběr */
  selectable?: boolean;
  /** Jednoduchý accessor — renderuje návratovou hodnotu */
  accessor?: (row: T) => React.ReactNode;
  /** Vlastní render buňky — má přednost před accessor */
  cell?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  keyField: (row: T) => React.Key;
  loading?: boolean;
  /** Co ukázat při prázdném seznamu (fallback „Žádná data…“ pokud neuvedeno) */
  empty?: React.ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  columns,
  data,
  keyField,
  loading,
  empty,
  className,
  onRowClick,
}: Props<T>) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-[rgb(var(--sb-border))] bg-[rgb(var(--sb-surface))]",
        className
      )}
    >
      <table className={cn("sb-table min-w-full text-sm")}>
        <thead>
          <tr className="text-[rgb(var(--sb-muted))] text-left">
            {columns.map((c) => (
              <th
                key={c.id}
                className={cn(
                  "px-3 py-2 font-medium",
                  c.width,
                  c.align ?? "text-left"
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                className="px-3 py-8 text-center text-[rgb(var(--sb-muted))]"
                colSpan={columns.length}
              >
                Načítám…
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td className="px-3 py-6" colSpan={columns.length}>
                {empty ?? (
                  <div className="text-[rgb(var(--sb-muted))]">Žádná data</div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyField(row)}
                className={cn(
                  "odd:bg-white even:bg-[rgb(var(--sb-surface-2))]",
                  onRowClick && "cursor-pointer hover:bg-slate-50"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((c) => (
                  <td
                    key={c.id}
                    className={cn("px-3 py-2 border-t border-[rgb(var(--sb-border))]", c.width, c.align, c.cellClass)}
                  >
                    {c.cell ? c.cell(row) : c.accessor ? c.accessor(row) : null}
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
