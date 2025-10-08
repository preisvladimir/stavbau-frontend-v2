// src/features/projects/components/ProjectsTable.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type {
  DataTableV2Sort,
  DataTableV2Column,
} from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';
import { DataTableV2 } from '@/components/ui/stavbau-ui/datatable/datatable-v2';
import type { ProjectSummaryDto } from '../api/types';

export type ProjectsTableProps = {
  /** Data aktuální stránky (server-side) */
  data: ProjectSummaryDto[];
  /** Načítání (ovlivňuje i ARIA status) */
  loading?: boolean;

  /** 0-based stránka, velikost a celkový počet (pro pager) */
  page?: number;
  pageSize?: number;
  totalItems?: number;

  /** Server-side ovladače stránkování a řazení (multi-sort) */
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
  sort: DataTableV2Sort;
  onSortChange: (sortState: DataTableV2Sort) => void;

  /** i18n, vyhledávání a vzhled */
  i18nNamespaces?: string[];
  search: string;
  onSearchChange: (q: string) => void;
  pageSizeOptions?: number[];
  defaultDensity?: 'compact' | 'cozy' | 'comfortable';
  variant?: 'surface' | 'plain';
  className?: string;

  /** interakce s řádky, akce a prázdný stav */
  onRowClick?: (p: ProjectSummaryDto) => void;
  rowActions?: (p: ProjectSummaryDto) => React.ReactNode;
  emptyContent?: React.ReactNode;

  /** legacy create (nepoužíváme – máme FAB/CTA) */
  canCreate?: boolean;
  onOpenCreate?: () => void;
};

/**
 * ProjectsTable – prezentační wrapper nad DataTableV2.
 * Sloupce definujeme zde, řízení (page/size/sort/search) přichází zvenku.
 */
function ProjectsTableBase({
  data,
  loading,
  i18nNamespaces = ['projects'],
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  sort,
  search,
  onSearchChange,
  pageSizeOptions = [5, 10, 20],
  defaultDensity = 'cozy',
  variant = 'surface',
  className,
  onRowClick,
  rowActions,
  emptyContent,
}: ProjectsTableProps) {
  const { t } = useTranslation(i18nNamespaces);

  /**
   * Sloupce pro náš DataTableV2 (interní typ).
   * - `accessor` dostává celý řádek (DTO)
   * - `cell` renderuje finální obsah buňky
   * - `id` je povinné a slouží i pro server-side sort (musí odpovídat BE allowlistu)
   */
  const columns = React.useMemo<DataTableV2Column<ProjectSummaryDto>[]>(() => [
    // Avatar/monogram – vizuální, bez řazení
    {
      id: 'avatar',
      header: '',
      accessor: (p) => p.name, // tabulka může využít k filtrování apod.
      cell: (p) => {
        const mono = (p.code || p.name || 'P').slice(0, 2).toUpperCase();
        return (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold">
            {mono}
          </div>
        );
      },
      enableSorting: false,
      meta: { stbMobile: { priority: 99, mobileHidden: true } },
    },
    // Kód projektu (často primární řazení)
    {
      id: 'code',
      header: t('list.columns.code'),
      accessor: (p) => p.code ?? '—',
      cell: (p) => (
        <span className="block xl:max-w-[160px] xl:truncate">{p.code ?? '—'}</span>
      ),
      meta: { stbMobile: { priority: 2, label: t('list.columns.code') } },
    },
    // Název projektu (title na mobilu)
    {
      id: 'name',
      header: t('list.columns.name'),
      accessor: (p) => p.name ?? '—',
      cell: (p) => (
        <span className="block xl:max-w-[260px] xl:truncate">{p.name ?? '—'}</span>
      ),
      meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
    },
    // Stav projektu (label z i18n, fallback na status/statusLabel)
    {
      id: 'status',
      header: t('list.columns.status'),
      accessor: (p) => p.statusLabel ?? p.status ?? '—',
      cell: (p) => (
        <span className="inline-flex items-center gap-1">
          {t(`status.${p.status}`, { defaultValue: p.statusLabel ?? p.status ?? '—' })}
        </span>
      ),
      meta: { stbMobile: { isSubtitle: true, priority: 1, label: t('list.columns.status') } },
    },
  ], [t]);

  return (
    <DataTableV2<ProjectSummaryDto>
      // i18n / vzhled
      i18nNamespaces={i18nNamespaces}
      variant={variant}
      className={className}
      defaultDensity={defaultDensity}

      // data & řízení (server-side)
      data={data}
      loading={loading}
      page={page}
      pageSize={pageSize}
      /** DataTableV2 očekává `total`; z našeho kontraktu přichází `totalItems`. */
      total={totalItems}
      sort={sort}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onSortChange={onSortChange}

      // vyhledávání (server-side)
      search={search}
      onSearchChange={onSearchChange}
      searchDebounceMs={250}

      // definice sloupců
      columns={columns}
      keyField={(p) => p.id}

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
    />
  );
}

export const ProjectsTable = React.memo(ProjectsTableBase);
