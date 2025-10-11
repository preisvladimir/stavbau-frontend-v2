// src/features/team/components/TeamTable.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataTableV2 } from '@/components/ui/stavbau-ui/datatable/datatable-v2';
import { Mail, Shield, User as UserIcon } from '@/components/icons';
import type { MemberSummaryDto } from '../api/types';
import type { Filters, ToolbarRoleOption} from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';

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

  /** NEW: řízené stránkování (server mode-ready) — 1-based page */
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (p: number) => void;       // 1-based
  onPageSizeChange?: (s: number) => void;
  enableClientPaging?: boolean;             // default true

  /** NEW: filtry a změna filtrů (řízené) */
  filters: Filters;
  onFiltersChange: (next: Filters) => void;

  /** NEW: options pro role filter v toolbaru */
  roleOptions?: ToolbarRoleOption[];
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
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  enableClientPaging = true,
  filters,
  onFiltersChange,
  roleOptions,
}: TeamTableProps) {
  const { t } = useTranslation(i18nNamespaces);

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
        id: 'name',
        header: t('list.columns.name'),
        accessor: (m: MemberSummaryDto) =>
          [m.firstName, m.lastName].filter(Boolean).join(' ') || m.displayName || '—',
        cell: (m: MemberSummaryDto) => (
          <span className="block xl:max-w-[260px] xl:truncate">
            {[m.firstName, m.lastName].filter(Boolean).join(' ') || m.displayName || '—'}
          </span>
        ),
        meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
      },
      {
        id: 'email',
        header: t('list.columns.email'),
        accessor: (m: MemberSummaryDto) => m.email ?? '—',
        cell: (m: MemberSummaryDto) => (
          <span className="inline-flex items-center gap-1 xl:max-w-[320px] xl:truncate">
            <Mail size={14} />
            <span className="truncate">{m.email ?? '—'}</span>
          </span>
        ),
        meta: { stbMobile: { isSubtitle: true, priority: 1, label: t('list.columns.email') } },
      },
      {
        id: 'role',
        header: t('list.columns.companyRole'),
        accessor: (m: MemberSummaryDto) => m.role ?? m.companyRole ?? '—',
        cell: (m: MemberSummaryDto) => (
          <span className="inline-flex items-center gap-1">
            <Shield size={14} />{' '}
            {t(`roles.${m.role ?? m.companyRole}`, {
              defaultValue: m.role ?? m.companyRole ?? '—',
            })}
          </span>
        ),
        meta: { stbMobile: { priority: 2, label: t('list.columns.companyRole') } },
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
      searchDebounceMs={250}
      loadingMode="auto"
      onRowClick={onRowClick}
      search={search}
      onSearchChange={onSearchChange}
      enableClientPaging={enableClientPaging}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      defaultDensity={defaultDensity}
      pageSizeOptions={pageSizeOptions}
      showToolbar
      showPager
      rowActions={rowActions}
      emptyContent={emptyContent}
      /** NEW: filtry a role options – použije toolbar DataTableV2 */
      filters={filters}
      onFiltersChange={onFiltersChange}
      roleOptions={roleOptions as any}
    />
  );
}
