// src/features/customers/components/CustomersTable.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataTableV2 } from '@/components/ui/stavbau-ui/datatable/datatable-v2';
import type {
  DataTableV2Sort,
  DataTableV2Column,
} from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';
import { Mail, Building2, IdCard } from '@/components/icons';
import type { CustomerSummaryDto } from '../api/types';

export type CustomersTableProps = {
  /** Data aktuální stránky (server-side) */
  data: CustomerSummaryDto[];
  /** Načítání (ovlivňuje i ARIA status) */
  loading?: boolean;

  /** 0-based stránka, velikost a celkový počet (pro pager) */
  page?: number;
  pageSize?: number;
  total?: number;
  pageCount?: number;

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
  onRowClick?: (c: CustomerSummaryDto) => void;
  rowActions?: (c: CustomerSummaryDto) => React.ReactNode;
  emptyContent?: React.ReactNode;

  /** legacy create (držíme pro konzistenci s ProjectsTable; aktuálně nevyužito) */
  canCreate?: boolean;
  onOpenCreate?: () => void;
};

/**
 * CustomersTable – prezentační wrapper nad DataTableV2 pro zákazníky.
 * - `id` sloupců musí sedět na BE allow-list pro řazení: 'name','email','ico','dic','updatedAt' (případně 'createdAt').
 * - Řízení stránkování/řazení/filtrace je server-side přes props (0-based stránkování).
 */
function CustomersTableBase({
  data,
  loading,
  i18nNamespaces = ['customers'],
  page,
  pageSize,
  total,
  pageCount,
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
}: CustomersTableProps) {
  const { t } = useTranslation(i18nNamespaces);

  const fmtDateTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleString?.() ?? iso : '—';

  const columns = React.useMemo<DataTableV2Column<CustomerSummaryDto>[]>(() => [
    {
      id: 'avatar',
      header: '',
      accessor: (c) => c.name ?? '',
      cell: () => (
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <Building2 size={16} />
        </div>
      ),
      enableSorting: false,
      meta: { stbMobile: { priority: 99, mobileHidden: true } },
    },
    {
      id: 'name',
      header: t('list.columns.name'),
      accessor: (c) => c.name ?? '—',
      cell: (c) => (
        <span className="block xl:max-w-[260px] xl:truncate">{c.name ?? '—'}</span>
      ),
      meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
    },
    {
      id: 'email',
      header: t('list.columns.email'),
      accessor: (c) => c.email ?? '—',
      cell: (c) => (
        <span className="inline-flex items-center gap-1 xl:max-w-[320px] xl:truncate">
          <Mail size={14} />
          <span className="truncate">{c.email ?? '—'}</span>
        </span>
      ),
      meta: { stbMobile: { isSubtitle: true, priority: 1, label: t('list.columns.email') } },
    },
    {
      id: 'ico',
      header: t('list.columns.ico'),
      accessor: (c) => c.ico ?? '—',
      cell: (c) => <span className="font-mono text-sm">{c.ico ?? '—'}</span>,
      meta: { stbMobile: { priority: 2, label: t('list.columns.ico') } },
    },
    {
      id: 'dic',
      header: t('list.columns.dic'),
      accessor: (c) => c.dic ?? '—',
      cell: (c) => (
        <span className="inline-flex items-center gap-1 font-mono text-sm">
          <IdCard size={14} /> {c.dic ?? '—'}
        </span>
      ),
      meta: { stbMobile: { priority: 3, label: t('list.columns.dic') } },
    },
    {
      id: 'updatedAt',
      header: t('list.columns.updatedAt'),
      accessor: (c) => c.updatedAt ?? '',
      cell: (c) => (
        <span className="text-sm text-[rgb(var(--sb-muted))]">
          {fmtDateTime(c.updatedAt)}
        </span>
      ),
      meta: { stbMobile: { priority: 4, label: t('list.columns.updatedAt') } },
    },
  ], [t]);

  return (
    <DataTableV2<CustomerSummaryDto>
      // i18n / vzhled
      i18nNamespaces={i18nNamespaces}
      variant={variant}
      className={className}
      defaultDensity={defaultDensity}

      // data & řízení (server-side)
      data={data}
      loading={loading}
      page={page}              // 0-based
      pageSize={pageSize}
      total={total}
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
      keyField={(c) => c.id}

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

export const CustomersTable = React.memo(CustomersTableBase);
