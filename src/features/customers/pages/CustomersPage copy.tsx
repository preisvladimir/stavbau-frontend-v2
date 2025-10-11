// src/features/customers/pages/CustomersPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';

import { CustomersTable } from '../components/CustomersTable';
import { CustomerDetailDrawer } from '../components/CustomerDetailDrawer';
import { CustomerFormDrawer } from '../components/CustomerFormDrawer';

import {
  listCustomerSummaries,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../api/client';
import type { CustomerDto, CustomerSummaryDto, CustomerFilters, UUID } from '../api/types';

import { Button } from '@/components/ui/stavbau-ui/button';
import { useOverlayRouting } from '@/lib/router/useOverlayRouting';
import { SmartEmptyState } from '@/components/ui/stavbau-ui/emptystate/SmartEmptyState';
import { UserPlus, Pencil, Trash2, Plus } from '@/components/icons';

import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { CUSTOMERS_SCOPES } from '../const/scopes';

import { useFab } from '@/components/layout';
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';
import LoadErrorStatus from '@/components/ui/stavbau-ui/feedback/LoadErrorStatus';
import { useServerTableState } from '@/lib/hooks/useServerTableState';

export default function CustomersPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['customers', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);
  const companyId = useRequiredCompanyId();

  // ------------------------------------------------------
  // Server-side fetcher (list)
  // ------------------------------------------------------
  const fetcher = React.useCallback(
    ({
      q,
      page,
      size,
      sort,
      filters,
    }: {
      q?: string;
      page?: number;
      size?: number;
      sort?: string | string[];
      filters?: CustomerFilters;
    }) =>
      listCustomerSummaries(companyId, {
        q,
        page,
        size,
        sort,
        status: filters?.status?.trim() || undefined,
      }),
    [companyId]
  );

  // ------------------------------------------------------
  // useServerTableState – jednotná logika pro page/sort/search/filters
  // ------------------------------------------------------
  const {
    data,
    loading,
    error,
    clearError,
    q,
    sort,
    // page,
    size,
    // filters,
    page1,
    total,
    onSearchChange,
    onSortChange,
    onPageChange,
    onPageSizeChange,
    // onFiltersChange,
    refreshList,
    refreshAfterMutation,
  } = useServerTableState<CustomerSummaryDto, CustomerFilters>({
    fetcher,
    defaults: {
      q: '',
      page: 0,
      size: 10,
      sort: [{ id: 'name', desc: false }],
      filters: { status: '' },
    },
    onError: (e) => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[CustomersPage] load error', e);
      }
    },
  });

  // ------------------------------------------------------
  // Routing (new/detail/edit overlay)
  // ------------------------------------------------------
  const {
    id: routeId,
    isNew,
    isDetail,
    isEdit,
    openNew,
    openDetail,
    openEdit,
    closeOverlays,
  } = useOverlayRouting({ module: 'customers' });

  // ------------------------------------------------------
  // CRUD handlers
  // ------------------------------------------------------
  const handleCreate = React.useCallback(
    async (values: Partial<CustomerDto>) => {
      await createCustomer(companyId, values as any);
      closeOverlays();
      await refreshAfterMutation(); // po create na 1. stránku
    },
    [companyId, closeOverlays, refreshAfterMutation]
  );

  const handleEdit = React.useCallback(
    async (values: Partial<CustomerDto>, id: UUID) => {
      await updateCustomer(companyId, id, values as any);
      closeOverlays();
      await refreshList();
    },
    [companyId, closeOverlays, refreshList]
  );

  const handleDelete = React.useCallback(
    async (id: UUID | string) => {
      await deleteCustomer(companyId, String(id));
      closeOverlays();
      await refreshList();
    },
    [companyId, closeOverlays, refreshList]
  );

  // ------------------------------------------------------
  // Empty state (kontext vyhledávání)
  // ------------------------------------------------------
  const emptyNode = (
    <SmartEmptyState
      hasSearch={!!q}
      i18nNamespaces={i18nNamespaces}
      // search stav
      searchTitleKey="list.emptyTitle"
      searchDescKey="list.emptyDesc"
      clearLabelKey="list.actions.open"
      onClearSearch={() => onSearchChange('')}
      // no-data stav
      emptyTitleKey="list.emptyTitle"
      emptyDescKey="list.emptyDesc"
      emptyAction={
        <ScopeGuard anyOf={[CUSTOMERS_SCOPES.RW, CUSTOMERS_SCOPES.CREATE]}>
          <Button leftIcon={<UserPlus size={16} />} onClick={openNew}>
            {t('list.actions.add', { defaultValue: 'Přidat zákazníka' })}
          </Button>
        </ScopeGuard>
      }
    />
  );

  // ------------------------------------------------------
  // FAB – primární CTA (Nový zákazník)
  // ------------------------------------------------------
  React.useEffect(() => {
    setFab({
      label: t('list.actions.new', { defaultValue: 'Nový zákazník' }),
      onClick: openNew,
      icon: <Plus className="h-6 w-6" />,
    });
    return () => setFab(null);
  }, [setFab, t, openNew]);

  // Výběr pro rychlý prefill do edit formu / detailu
  const selectedCustomer = React.useMemo(
    () => (routeId ? data.items.find((i) => String(i.id) === routeId) ?? null : null),
    [data.items, routeId]
  );

  // ------------------------------------------------------
  // Render
  // ------------------------------------------------------
  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        <div className="mb-4 flex items-center justify-between gap-2 md:gap-4">
          <h1 className="text-xl font-semibold">
            {t('title', { defaultValue: 'Zákazníci' })}
          </h1>

          {/* Primární CTA (duplicitně k FAB pro desktop) */}
          <div className="hidden min-w-0 w-full md:w-auto md:flex items-center gap-2 md:gap-3">
            <ScopeGuard anyOf={[CUSTOMERS_SCOPES.CREATE, CUSTOMERS_SCOPES.RW]}>
              <Button
                type="button"
                variant="primary"
                onClick={openNew}
                disabled={loading}
                ariaLabel={t('actions.newCustomer', { defaultValue: 'Nový zákazník' }) as string}
                leftIcon={<Plus size={16} />}
                className="shrink-0 whitespace-nowrap"
              >
                <span>{t('actions.newCustomer', { defaultValue: 'Nový zákazník' })}</span>
              </Button>
            </ScopeGuard>
          </div>
        </div>

        {/* ARIA status (bez layout shiftu) */}
        <span className="sr-only" role="status" aria-live="polite">
          {loading ? t('loading', { defaultValue: 'Načítám…' }) : ''}
        </span>

        {/* Status */}
        <LoadErrorStatus
          loading={loading}
          error={error}
          onClear={clearError}
          // onRetry={() => refreshList()}         // volitelné
          i18nNamespaces={i18nNamespaces}
        //labels={{ loading: 'Loading…', error: 'Failed to load', close: 'Close' }} // volitelné
        />

        {/* TABLE */}
        <CustomersTable
          data={data.items}
          loading={loading}
          page={page1}
          pageSize={size}
          total={total}//{data.total ?? data.totalElements ?? 0}
          pageCount={data.totalPages}
          sort={sort}
          search={q}
          // ovládání
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onSortChange={onSortChange}
          onSearchChange={onSearchChange}
          // vzhled / texty
          i18nNamespaces={i18nNamespaces}
          className="mt-2"
          variant="surface"
          defaultDensity="cozy"
          pageSizeOptions={[5, 10, 20]}
          // interakce s řádky
          onRowClick={(p) => openDetail(p.id as UUID)}
          rowActions={(c) => (
            <div className="flex items-center gap-2">
              <ScopeGuard anyOf={[CUSTOMERS_SCOPES.RW, CUSTOMERS_SCOPES.UPDATE]}>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={t('detail.actions.edit', { defaultValue: 'Upravit' }) as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(c.id as UUID);
                  }}
                  title={t('detail.actions.edit', { defaultValue: 'Upravit' }) as string}
                >
                  <Pencil size={16} />
                </Button>
              </ScopeGuard>
              <ScopeGuard anyOf={[CUSTOMERS_SCOPES.RW, CUSTOMERS_SCOPES.DELETE]}>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label={t('detail.actions.delete', { defaultValue: 'Smazat' }) as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(c.id as UUID);
                  }}
                  title={t('detail.actions.delete', { defaultValue: 'Smazat' }) as string}
                >
                  <Trash2 size={16} />
                </Button>
              </ScopeGuard>
            </div>
          )}
          emptyContent={emptyNode}
          // Create skrze FAB / primární CTA nahoře
          canCreate={false}
          onOpenCreate={undefined}
        /** NEW: řízené filtry + options pro role */
        //filters={filters}
        //onFiltersChange={(next) => onFiltersChange(next)}
        //roleOptions={roleOptions}
        />

        {/* Create */}
        <CustomerFormDrawer
          mode="create"
          i18nNamespaces={i18nNamespaces}
          open={isNew}
          companyId={companyId}
          onClose={closeOverlays}
          onSubmit={handleCreate}
        />

        {/* Detail (prefill + detail fetch uvnitř) */}
        <CustomerDetailDrawer
          i18nNamespaces={i18nNamespaces}
          open={isDetail && !isEdit}
          companyId={companyId}
          onClose={closeOverlays}
          onEdit={() => openEdit(routeId as UUID)}
          onDelete={(id) => void handleDelete(id)}
          prefill={selectedCustomer ?? undefined}
          id={isDetail ? (routeId as UUID) : null}
        />

        {/* Edit */}
        <CustomerFormDrawer
          mode="edit"
          i18nNamespaces={i18nNamespaces}
          open={!!isEdit}
          id={isEdit ? (routeId as UUID) : undefined}
          companyId={companyId}
          titleKey="form.title.edit"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleEdit(vals, routeId as UUID)}
          defaultValues={{
            name: selectedCustomer?.name ?? '',
            ico: (selectedCustomer as any)?.ico ?? '',
            dic: (selectedCustomer as any)?.dic ?? '',
          } as any}
        />
      </div>
    </div>
  );
}
