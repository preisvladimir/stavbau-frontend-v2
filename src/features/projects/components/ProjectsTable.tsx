// src/features/projects/components/ProjectsTable.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { DataTableV2Sort } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';
import { DataTableV2 } from '@/components/ui/stavbau-ui/datatable/datatable-v2';
import type { ProjectSummaryDto } from '../api/types';

export type ProjectsTableProps = {
  data: ProjectSummaryDto[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
  onSortChange: (sortState: DataTableV2Sort) => void;
  sort: DataTableV2Sort;
  i18nNamespaces?: string[];
  search: string;
  onSearchChange: (q: string) => void;
  pageSizeOptions?: number[];
  defaultDensity?: 'compact' | 'cozy' | 'comfortable';
  variant?: 'surface' | 'plain';
  className?: string;
  onRowClick?: (p: ProjectSummaryDto) => void;
  rowActions?: (p: ProjectSummaryDto) => React.ReactNode;
  emptyContent?: React.ReactNode;
  canCreate?: boolean;
  onOpenCreate?: () => void;
};

export function ProjectsTable({
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

  const columns = React.useMemo(
    () => [
      {
        id: 'avatar',
        header: '',
        accessor: (p: ProjectSummaryDto) => p.name,
        cell: (p: ProjectSummaryDto) => (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold">
            {(p.code || p.name || 'P').slice(0, 2).toUpperCase()}
          </div>
        ),
        enableSorting: false,
        meta: { stbMobile: { priority: 99, mobileHidden: true } },
      },
      {
        id: 'code',
        header: t('list.columns.code'),
        accessor: (p: ProjectSummaryDto) => p.code ?? '—',
        cell: (p: ProjectSummaryDto) => (
          <span className="block xl:max-w-[160px] xl:truncate">{p.code ?? '—'}</span>
        ),
        meta: { stbMobile: { priority: 2, label: t('list.columns.code') } },
      },
      {
        id: 'name',
        header: t('list.columns.name'),
        accessor: (p: ProjectSummaryDto) => p.name ?? '—',
        cell: (p: ProjectSummaryDto) => (
          <span className="block xl:max-w-[260px] xl:truncate">{p.name ?? '—'}</span>
        ),
        meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
      },
      {
        id: 'status',
        header: t('list.columns.status'),
        accessor: (p: ProjectSummaryDto) => p.statusLabel ?? p.status ?? '—',
        cell: (p: ProjectSummaryDto) => (
          <span className="inline-flex items-center gap-1">
            {t(`status.${p.status}`, { defaultValue: p.statusLabel ?? p.status ?? '—' })}
          </span>
        ),
        meta: { stbMobile: { isSubtitle: true, priority: 1, label: t('list.columns.status') } },
      },
    ],
    [t]
  );

  return (
    <DataTableV2<ProjectSummaryDto>
      i18nNamespaces={i18nNamespaces}
      variant={variant}
      className={className}
      data={data}
      page={page}
      pageSize={pageSize}
      total={totalItems}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onSortChange={onSortChange}
      sort={sort}
      columns={columns as any}
      keyField={(p) => p.id}
      loading={loading}
      searchDebounceMs={250}
      loadingMode="auto"
      onRowClick={onRowClick}
      search={search}
      onSearchChange={onSearchChange}
      defaultDensity={defaultDensity}
      pageSizeOptions={pageSizeOptions}
      showToolbar
      showPager
      rowActions={rowActions}
      emptyContent={emptyContent}
    />
  );
}
