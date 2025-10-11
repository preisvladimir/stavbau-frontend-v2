// src/components/ui/stavbau-ui/datatable/StbEntityTable.tsx
import * as React from 'react';
import { DataTableV2 } from '@/components/ui/stavbau-ui/datatable/datatable-v2';
import type {
  DataTableV2Sort,
  DataTableV2Column,
  Filters,
  ToolbarRoleOption,
} from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';

export type StbEntityTableProps<T> = {
  // Data & řízení (server-side)
  data: T[];
  loading?: boolean;

  /** 1-based stránka (globální konvence pro serverové volání) */
  page?: number;         // 1-based
  pageSize?: number;
  total?: number;
  pageCount?: number;

  sort: DataTableV2Sort;
  onPageChange: (nextPage: number) => void;       // dostane 1-based
  onPageSizeChange: (nextSize: number) => void;
  onSortChange: (sortState: DataTableV2Sort) => void;

  // Vyhledávání (server-side)
  search: string;
  onSearchChange: (q: string) => void;

  // Definice sloupců (modul dodá)
  columns: DataTableV2Column<T>[];
  keyField: (row: T) => string;

  // i18n / vzhled
  i18nNamespaces?: string[];
  pageSizeOptions?: number[];
  defaultDensity?: 'compact' | 'cozy' | 'comfortable';
  variant?: 'surface' | 'plain';
  className?: string;

  // Interakce / doplňky
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  emptyContent?: React.ReactNode;

  // Filtry (řízené) – volitelné, kompatibilní s Team modulem
  filters?: Filters;
  onFiltersChange?: (next: Filters) => void;

  /** Volitelně pro Team toolbar (role filtr) – passthrough na DataTableV2 */
  roleOptions?: ToolbarRoleOption[];
};

export function StbEntityTable<T>({
  data,
  loading,
  i18nNamespaces,
  page,
  pageSize,
  total,
  pageCount,
  onPageChange,
  onPageSizeChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  columns,
  keyField,
  pageSizeOptions = [5, 10, 20],
  defaultDensity = 'cozy',
  variant = 'surface',
  className,
  onRowClick,
  rowActions,
  emptyContent,
  filters,
  onFiltersChange,
  roleOptions,
}: StbEntityTableProps<T>) {
  return (
    <DataTableV2<T>
      // i18n / vzhled
      i18nNamespaces={i18nNamespaces}
      variant={variant}
      className={className}
      defaultDensity={defaultDensity}

      // data & řízení (server-side)
      data={data}
      loading={loading}
      enableClientPaging={false}
      enableClientSort={false}
      page={page}                // 1-based
      pageSize={pageSize}
      total={total}
      pageCount={pageCount}
      sort={sort}
      onPageChange={onPageChange}           // předáváme 1-based dál
      onPageSizeChange={onPageSizeChange}
      onSortChange={onSortChange}

      // vyhledávání (server-side)
      search={search}
      onSearchChange={onSearchChange}
      searchDebounceMs={250}

      // sloupce
      columns={columns}
      keyField={keyField}

      // UX
      loadingMode="auto"
      showToolbar
      showPager
      pageSizeOptions={pageSizeOptions}

      // řádkové akce / interakce
      onRowClick={onRowClick}
      rowActions={rowActions}

      // prázdný stav
      emptyContent={emptyContent}

      // filtry / doplňky (kompatibilita s Team)
      filters={filters}
      onFiltersChange={onFiltersChange}
      roleOptions={roleOptions as any}
    />
  );
}

export default React.memo(StbEntityTable) as typeof StbEntityTable;
