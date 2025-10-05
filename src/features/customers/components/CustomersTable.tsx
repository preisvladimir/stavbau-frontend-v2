// src/features/customers/components/CustomersTable.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataTableV2 } from '@/components/ui/stavbau-ui/datatable/datatable-v2';
import { Mail, Building2, IdCard } from '@/components/icons';
import type { CustomerSummaryDto } from '../api/types';

export type CustomersTableProps = {
  data: CustomerSummaryDto[];
  loading?: boolean;
  i18nNamespaces?: string[];
  search: string;
  onSearchChange: (q: string) => void;
  pageSizeOptions?: number[];
  defaultDensity?: 'compact' | 'cozy' | 'comfortable';
  variant?: 'surface' | 'plain';
  className?: string;
  onRowClick?: (c: CustomerSummaryDto) => void;
  rowActions?: (c: CustomerSummaryDto) => React.ReactNode;
  emptyContent?: React.ReactNode;
  canCreate?: boolean;          // zachováno kvůli konzistenci s ProjectsTable (aktuálně nevyužito)
  onOpenCreate?: () => void;    // dto.
};

export function CustomersTable({
  data,
  loading,
  i18nNamespaces = ['customers'],
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

  const columns = React.useMemo(
    () => [
      {
        id: 'avatar',
        header: '',
        accessor: (c: CustomerSummaryDto) => c.name ?? '',
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
        accessor: (c: CustomerSummaryDto) => c.name ?? '—',
        cell: (c: CustomerSummaryDto) => (
          <span className="block xl:max-w-[260px] xl:truncate">{c.name ?? '—'}</span>
        ),
        meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
      },
      {
        id: 'email',
        header: t('list.columns.email'),
        accessor: (c: CustomerSummaryDto) => c.email ?? '—',
        cell: (c: CustomerSummaryDto) => (
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
        accessor: (c: CustomerSummaryDto) => c.ico ?? '—',
        cell: (c: CustomerSummaryDto) => <span className="font-mono text-sm">{c.ico ?? '—'}</span>,
        meta: { stbMobile: { priority: 2, label: t('list.columns.ico') } },
      },
      {
        id: 'dic',
        header: t('list.columns.dic'),
        accessor: (c: CustomerSummaryDto) => c.dic ?? '—',
        cell: (c: CustomerSummaryDto) => (
          <span className="inline-flex items-center gap-1 font-mono text-sm">
            <IdCard size={14} /> {c.dic ?? '—'}
          </span>
        ),
        meta: { stbMobile: { priority: 3, label: t('list.columns.dic') } },
      },
      {
        id: 'updatedAt',
        header: t('list.columns.updatedAt'),
        accessor: (c: CustomerSummaryDto) => c.updatedAt ?? '',
        cell: (c: CustomerSummaryDto) => (
          <span className="text-sm text-[rgb(var(--sb-muted))]">
            {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}
          </span>
        ),
        meta: { stbMobile: { priority: 4, label: t('list.columns.updatedAt') } },
      },
    ],
    [t]
  );

  return (
    <DataTableV2<CustomerSummaryDto>
      i18nNamespaces={i18nNamespaces}
      variant={variant}
      className={className}
      data={data}
      columns={columns as any}
      keyField={(c) => c.id}
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
