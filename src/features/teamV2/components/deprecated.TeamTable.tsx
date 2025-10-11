import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataTableV2 } from '@/components/ui/stavbau-ui/datatable/datatable-v2';
import { Mail, Shield, User as UserIcon } from '@/components/icons';
import type { MemberSummaryDto } from '../api/types';
import type {
  Filters,
  ToolbarRoleOption,
  DataTableV2Sort,
  DataTableV2Column,
} from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';

export type TeamTableProps = {
  data: MemberSummaryDto[];
  /** Načítání (ovlivňuje i ARIA status) */
  loading?: boolean;

  /** 1-based stránka, velikost a celkový počet (pro pager) */
  page?: number;                  // 1-based
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
  onRowClick?: (p: MemberSummaryDto) => void;
  rowActions?: (p: MemberSummaryDto) => React.ReactNode;
  emptyContent?: React.ReactNode;

  /** legacy create (nepoužíváme – máme FAB/CTA) */
  canCreate?: boolean;
  onOpenCreate?: () => void;

  /** NEW: filtry a změna filtrů (řízené) */
  filters: Filters;
  onFiltersChange: (next: Filters) => void;

  /** NEW: options pro role filter v toolbaru */
  roleOptions?: ToolbarRoleOption[];
};


function TeamTableBase({
  data,
  loading,
  i18nNamespaces = ['team'],
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
  filters,
  onFiltersChange,
  roleOptions,
}: TeamTableProps) {
  const { t } = useTranslation(i18nNamespaces);


  /**
    * Sloupce pro DataTableV2
    * - `id` musí odpovídat BE allowlistu pro sort; volíme: 'lastName', 'user.email'
    * - role necháváme bez řazení (není v allowlistu)
    */
  const columns = React.useMemo<DataTableV2Column<MemberSummaryDto>[]>(() => [
    {
      id: 'avatar',
      header: '',
      accessor: (_m) => '',
      cell: () => (
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <UserIcon size={16} />
        </div>
      ),
      enableSorting: false,
      meta: { stbMobile: { priority: 99, mobileHidden: true } },
    },
    {
      // Sort klíč nastavíme na 'lastName' (BE allowlist), ale zobrazíme celé jméno
      id: 'lastName',
      header: t('list.columns.lastname'),
      accessor: (m) => m.lastName ?? '—',

      cell: (m) => (
        <span className="block xl:max-w-[260px] xl:truncate">
          {m.lastName ?? '—'}
        </span>
      ),
      meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
    }, 
    {

      // Sort klíč nastavíme na 'lastName' (BE allowlist), ale zobrazíme celé jméno
      id: 'firstName',
      header: t('list.columns.firstname'),
      accessor: (m) => m.firstName ?? '—',

      cell: (m) => (
        <span className="block xl:max-w-[260px] xl:truncate">
          {m.firstName ?? '—'}
        </span>
      ),
      meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
    },

    {

      // Aliased allowlist klíč z BE: 'user.email'
      id: 'user.email',
      header: t('list.columns.email'),
      accessor: (m) => m.email ?? '—',
      cell: (m) => (
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
      accessor: (m) => m.role ?? m.companyRole ?? '—',
      cell: (m) => (
        <span className="inline-flex items-center gap-1">
          <Shield size={14} />{' '}
          {t(`roles.${m.role ?? m.companyRole}`, {
            defaultValue: m.role ?? m.companyRole ?? '—',
          })}
        </span>
      ),
      enableSorting: false, // 'role' není v BE allowlistu → necháme bez řazení
      meta: { stbMobile: { priority: 2, label: t('list.columns.companyRole') } },
    },

  ], [t]);

  return (
    <DataTableV2<MemberSummaryDto>
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
      page={page}   // už 1-based; přichází z TeamPage jako page+1
      pageSize={pageSize}
      // pageCount je volitelné; když ho předáš, bude respekován
      // pageCount nechat spočítat v DataTableV2 z total/pageSize
      /** DataTableV2 očekává `total`; z kontraktu posíláme totalItems/total */
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

      /** NEW: filtry a role options – použije toolbar DataTableV2 */
      filters={filters}
      onFiltersChange={onFiltersChange}
      roleOptions={roleOptions as any}
    />
  );
}

export const TeamTable = React.memo(TeamTableBase);
