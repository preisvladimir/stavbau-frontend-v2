// src/features/customers/pages/CustomersPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';

// --- App hooks & routing ---
import { useOverlayRouting } from '@/lib/router/useOverlayRouting';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';
import { useServerTableState } from '@/lib/hooks/useServerTableState';
import { useFab } from '@/components/layout';

// --- RBAC / guards ---
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { CUSTOMERS_SCOPES } from '../const/scopes';

// --- API / service ---
import { customersService } from '@/features/customers/api/customers-service';
import type { CustomerFilters } from '@/features/customers/api/customers-service';

// --- Types ---
import type { CustomerDto, CustomerSummaryDto, UUID } from '../api/types';

// --- UI components ---
import { CustomersTable } from '../components/CustomersTable';
import { CustomerDetailDrawer } from '../components/CustomerDetailDrawer';
import { CustomerFormDrawer } from '../components/CustomerFormDrawer';
import { TableHeader } from '@/components/ui/stavbau-ui/datatable/TableHeader';
import RowActions from '@/components/ui/stavbau-ui/datatable/RowActions';
import { ServerTableEmpty } from '@/components/ui/stavbau-ui/emptystate/ServerTableEmpty';
import LoadErrorStatus from '@/components/ui/stavbau-ui/feedback/LoadErrorStatus';
import { Button } from '@/components/ui/stavbau-ui/button';

// --- UI utils & tokens ---
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';
import { UserPlus, Plus } from '@/components/icons';

export default function CustomersPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['customers', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);

  const companyId = useRequiredCompanyId();
  const customers = React.useMemo(() => customersService(companyId), [companyId]);

  // ---------------------------------------------------------------------------
  // Server-side řízení tabulky
  // ---------------------------------------------------------------------------
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
      customers.list({
        q,
        page,
        size,
        sort,
        filters, // wrapper si sám převede status přes filtersToQuery
      }),
    [customers]
  );

  const {
    data,
    loading,
    error,
    clearError,
    q,
    sort,
    size,
    // filters,              // (případně přidej UI filtry)
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

  // ---------------------------------------------------------------------------
  // Routing (new/detail/edit)
  // ---------------------------------------------------------------------------
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

  // Pro rychlý prefill do detailu / editu
  const selectedCustomer = React.useMemo(
    () => (routeId ? data.items.find((i) => String(i.id) === routeId) ?? null : null),
    [data.items, routeId]
  );

  // ---------------------------------------------------------------------------
  // CRUD handlery
  // ---------------------------------------------------------------------------
  const handleCreate = React.useCallback(
    async (values: Partial<CustomerDto>) => {
      await customers.create(values as any);
      closeOverlays();
      await refreshAfterMutation(); // po create skoč na 1. stránku
    },
    [customers, closeOverlays, refreshAfterMutation]
  );

  const handleEdit = React.useCallback(
    async (values: Partial<CustomerDto>, id: UUID) => {
      await customers.update(id, values as any);
      closeOverlays();
      await refreshList();
    },
    [customers, closeOverlays, refreshList]
  );

  const handleDelete = React.useCallback(
    async (id: UUID | string) => {
      await customers.remove(id as UUID);
      closeOverlays();
      await refreshList();
    },
    [customers, closeOverlays, refreshList]
  );

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  const emptyNode = (
    <ServerTableEmpty
      q={q}
      i18nNamespaces={i18nNamespaces}
      onClearSearch={() => onSearchChange('')}
      requiredScopesAnyOf={[CUSTOMERS_SCOPES.RW, CUSTOMERS_SCOPES.CREATE]}
      emptyAction={
        <Button leftIcon={<UserPlus size={16} />} onClick={openNew}>
          {t('list.actions.add', { defaultValue: 'Přidat zákazníka' })}
        </Button>
      }
    />
  );

  // ---------------------------------------------------------------------------
  // FAB
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    setFab({
      label: t('list.actions.new', { defaultValue: 'Nový zákazník' }),
      onClick: openNew,
      icon: <Plus className="h-6 w-6" />,
    });
    return () => setFab(null);
  }, [setFab, t, openNew]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        {/* Header sjednocený s TeamPage */}
        <TableHeader
          title={t('title', { defaultValue: 'Zákazníci' })}
          subtitle={t('subtitle', { defaultValue: 'Správa zákazníků' })}
          actions={
            <ScopeGuard anyOf={[CUSTOMERS_SCOPES.CREATE, CUSTOMERS_SCOPES.RW]}>
              <Button
                type="button"
                variant="primary"
                onClick={openNew}
                disabled={loading}
                ariaLabel={t('actions.newCustomer', { defaultValue: 'Nový zákazník' }) as string}
                leftIcon={<UserPlus size={16} />}
                className="shrink-0 whitespace-nowrap"
              >
                <span>{t('actions.newCustomer', { defaultValue: 'Nový zákazník' })}</span>
              </Button>
            </ScopeGuard>
          }
        />

        {/* Status (ARIA + error banner) */}
        <LoadErrorStatus
          loading={loading}
          error={error}
          onClear={clearError}
          i18nNamespaces={i18nNamespaces}
        />

        {/* Tabulka zákazníků (server-side řízená) */}
        <CustomersTable
          // data
          data={data.items}
          loading={loading}
          // server-side pager/sort
          page={page1}                 // 1-based pro DataTableV2
          pageSize={size}
          total={total}
          pageCount={data.totalPages}
          sort={sort}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onSortChange={onSortChange}
          // search
          search={q}
          onSearchChange={onSearchChange}
          // vzhled / texty
          i18nNamespaces={i18nNamespaces}
          className="mt-2"
          variant="surface"
          defaultDensity="cozy"
          pageSizeOptions={[5, 10, 20]}
          // interakce s řádky
          onRowClick={(c) => openDetail(c.id as UUID)}
          rowActions={(c) => (
            <RowActions
              item={c}
              asMenu
              maxInline={2}
              compact
              i18nNamespaces={i18nNamespaces}
              menuLabel={t('list.actions.title', { defaultValue: 'Akce' })}
              actions={[
                { kind: 'detail', onClick: () => openDetail(c.id as UUID) },
                { kind: 'edit', onClick: () => openEdit(c.id as UUID), scopesAnyOf: [CUSTOMERS_SCOPES.UPDATE, CUSTOMERS_SCOPES.RW] },
                { kind: 'delete', onClick: () => handleDelete(c.id as UUID), scopesAnyOf: [CUSTOMERS_SCOPES.DELETE, CUSTOMERS_SCOPES.RW], confirm: {} },
              ]}
            />
          )}
          emptyContent={emptyNode}
          // Create skrze FAB / CTA nahoře
          canCreate={false}
          onOpenCreate={undefined}
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

        {/* Detail */}
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
