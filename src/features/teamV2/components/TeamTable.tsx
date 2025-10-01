import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataTableV2 } from '@/components/ui/stavbau-ui/datatable/datatable-v2';
import { Mail, Shield, User as UserIcon } from '@/components/icons';
import type { MemberSummaryDto } from '../api/types';

export type TeamTableProps = {
  data: MemberSummaryDto[];
  loading?: boolean;
  i18nNamespaces?: string[];
  search: string;
  onSearchChange: (q: string) => void;
  pageSizeOptions?: number[];
  defaultDensity?: 'compact' | 'cozy' | 'comfortable';
  variant?: 'surface' | 'plain';
  className?: string;
  onRowClick?: (m: MemberSummaryDto) => void;
  rowActions?: (m: MemberSummaryDto) => React.ReactNode;
  emptyContent?: React.ReactNode;
};

export function TeamTable({
  data,
  loading,
  i18nNamespaces = ['team'],
  search,
  onSearchChange,
  pageSizeOptions = [5, 10, 20],
  defaultDensity = 'cozy',
  variant = 'surface',
  className,
  onRowClick,
  rowActions,
  emptyContent,
}: TeamTableProps) {
  const { t } = useTranslation('team');

  const columns = React.useMemo(
    () => [
      {
        id: 'avatar',
        header: '',
        accessor: (_m: MemberSummaryDto) => '',
        cell: () => (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <UserIcon size={16} />
          </div>
        ),
        enableSorting: false,
        meta: { stbMobile: { priority: 99, mobileHidden: true } },
      },
      {
        id: 'email',
        header: t('list.columns.email'),
        accessor: (m: MemberSummaryDto) => m.email,
        cell: (m: MemberSummaryDto) => (
          <span className="inline-flex items-center gap-1 xl:max-w-[320px] xl:truncate">
            <Mail size={14} />
            <span className="truncate">{m.email}</span>
          </span>
        ),
        meta: { stbMobile: { isSubtitle: true, priority: 1, label: t('list.columns.email') } },
      },
      {
        id: 'role',
        header: t('list.columns.companyRole'),
        accessor: (m: MemberSummaryDto) => m.role ?? '—',
        cell: (m: MemberSummaryDto) => (
          <span className="inline-flex items-center gap-1">
            <Shield size={14} /> {t(`roles.${m.role}`, { defaultValue: m.role ?? '—' })}
          </span>
        ),
        meta: { stbMobile: { priority: 2, label: t('list.columns.companyRole') } },
      },
      {
        id: 'name',
        header: t('list.columns.name'),
        accessor: (m: MemberSummaryDto) => [m.firstName, m.lastName].filter(Boolean).join(' ') || m.displayName || '—',
        cell: (m: MemberSummaryDto) => (
          <span className="block xl:max-w-[240px] xl:truncate">
            {[m.firstName, m.lastName].filter(Boolean).join(' ') || m.displayName || '—'}
          </span>
        ),
        meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
      },
    ],
    [t]
  );

  return (
    <DataTableV2<MemberSummaryDto>
      i18nNamespaces={i18nNamespaces}
      variant={variant}
      className={className}
      data={data}
      columns={columns as any}
      keyField={(m) => m.id}
      loading={loading}
      searchDebounceMs={250}  // volitelné
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