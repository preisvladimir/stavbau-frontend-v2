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
import { StbEntityTable } from '@/components/ui/stavbau-ui/datatable/StbEntityTable';
import type { DataTableV2Column } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';
import { TableHeader } from '@/components/ui/stavbau-ui/datatable/TableHeader';
import RowActions from '@/components/ui/stavbau-ui/datatable/RowActions';
import { ServerTableEmpty } from '@/components/ui/stavbau-ui/emptystate/ServerTableEmpty';
import LoadErrorStatus from '@/components/ui/stavbau-ui/feedback/LoadErrorStatus';
import { Button } from '@/components/ui/stavbau-ui/button';
import { CrudDrawer } from '@/components/ui/stavbau-ui/drawer/crud-drawer'; // ← náš orchestrátor

// --- Feature UI (prezentační, bez fetch) ---
import { Detail } from '../components/Detail';
import { Form, type FormValues } from '../components/Form';

// --- Mappers ---
import { dtoToFormDefaults } from '../mappers';

// --- UI utils & tokens ---
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';
import { UserPlus, Plus, Mail, User as UserIcon } from '@/components/icons';

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
      q, page, size, sort, filters,
    }: { q?: string; page?: number; size?: number; sort?: string | string[]; filters?: CustomerFilters }) =>
      customers.list({ q, page, size, sort, filters }),
    [customers]
  );

  const {
    data, loading, error, clearError, q, sort, size,
    page1, total, onSearchChange, onSortChange, onPageChange, onPageSizeChange,
    refreshList, refreshAfterMutation,
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
      if (process.env.NODE_ENV !== 'production') console.debug('[CustomersPage] load error', e);
    },
  });

  // ---------------------------------------------------------------------------
  // Routing (new/detail/edit)
  // ---------------------------------------------------------------------------
  const {
    id: routeId, isNew, isDetail, isEdit, openNew, openDetail, openEdit, closeOverlays,
  } = useOverlayRouting({ module: 'customers' });

  // Prefill ze seznamu (rychlý náhled)
  const selectedCustomer = React.useMemo(
    () => (routeId ? data.items.find((i) => String(i.id) === routeId) ?? null : null),
    [data.items, routeId]
  );

  // ---------------------------------------------------------------------------
  // CRUD handlery
  // ---------------------------------------------------------------------------
  const handleCreate = React.useCallback(
    async (values: FormValues) => {
      await customers.create(values as any);
      closeOverlays();
      await refreshAfterMutation();
    },
    [customers, closeOverlays, refreshAfterMutation]
  );

  const handleEdit = React.useCallback(
    async (values: FormValues, id: UUID) => {
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

  // FAB
  React.useEffect(() => {
    setFab({
      label: t('list.actions.new', { defaultValue: 'Nový zákazník' }),
      onClick: openNew,
      icon: <Plus className="h-6 w-6" />,
    });
    return () => setFab(null);
  }, [setFab, t, openNew]);

  // Sloupce tabulky
  const columns = React.useMemo<DataTableV2Column<CustomerSummaryDto>[]>(() => [
    {
      id: 'avatar',
      header: '',
      accessor: (_c) => '',
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
      header: t('columns.name', { defaultValue: 'Název' }),
      accessor: (c) => c.name,
      sortable: true,
      minWidth: 220,
      meta: { stbMobile: { isTitle: true, priority: 0, label: t('columns.name') } },
    },
    {
      id: 'email',
      header: t('columns.email', { defaultValue: 'E-mail' }),
      accessor: (c) => (c as any).email ?? '—',
      cell: (c) => (
        <span className="inline-flex items-center gap-1 xl:max-w-[320px] xl:truncate">
          <Mail size={14} />
          <span className="truncate">{(c as any).email ?? '—'}</span>
        </span>
      ),
      sortable: true,
      meta: { stbMobile: { isSubtitle: true, priority: 1, label: t('columns.email') } },
    },
    {
      id: 'ico',
      header: t('columns.ico', { defaultValue: 'IČO' }),
      accessor: (c) => (c as any).ico ?? '—',
      sortable: true,
      width: 120,
      meta: { stbMobile: { priority: 2, label: t('columns.ico') } },
    },
    {
      id: 'dic',
      header: t('columns.dic', { defaultValue: 'DIČ' }),
      accessor: (c) => (c as any).dic ?? '—',
      sortable: true,
      width: 140,
      meta: { stbMobile: { priority: 3, label: t('columns.dic') } },
    },
    {
      id: 'updatedAt',
      header: t('columns.updatedAt', { defaultValue: 'Upraveno' }),
      accessor: (c) => (c as any).updatedAt ?? (c as any).createdAt ?? '',
      sortable: true,
      width: 140,
    },
  ], [t]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        <TableHeader
          title={t('title', { defaultValue: 'Zákazníci' })}
          subtitle={t('subtitle', { defaultValue: 'Správa zákazníků' })}
          actions={
            <ScopeGuard anyOf={[CUSTOMERS_SCOPES.CREATE, CUSTOMERS_SCOPES.RW]}>
              <Button type="button" variant="primary" onClick={openNew} disabled={loading}
                ariaLabel={t('actions.newCustomer', { defaultValue: 'Nový zákazník' }) as string}
                leftIcon={<UserPlus size={16} />} className="shrink-0 whitespace-nowrap">
                <span>{t('actions.newCustomer', { defaultValue: 'Nový zákazník' })}</span>
              </Button>
            </ScopeGuard>
          }
        />

        <LoadErrorStatus loading={loading} error={error} onClear={clearError} i18nNamespaces={i18nNamespaces} />

        <StbEntityTable<CustomerSummaryDto>
          i18nNamespaces={i18nNamespaces}
          className="mt-2"
          variant="surface"
          defaultDensity="cozy"
          pageSizeOptions={[5, 10, 20]}
          data={data.items}
          loading={loading}
          page={page1}
          pageSize={size}
          total={total}
          pageCount={data.totalPages}
          sort={sort}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onSortChange={onSortChange}
          search={q}
          onSearchChange={onSearchChange}
          columns={columns}
          keyField={(c) => String(c.id)}
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
        />

        {/* --- JEDEN orchestrátor pro detail/create/edit --- */}
        <CrudDrawer<CustomerSummaryDto, FormValues>
          isDetail={isDetail && !isEdit}
          isNew={isNew}
          isEdit={!!isEdit}
          entityId={isDetail || isEdit ? (routeId as UUID) : null}
          onClose={closeOverlays}
          titles={{
            detail: t('detail.title', { defaultValue: 'Detail zákazníka' }),
            create: t('form.title.create', { defaultValue: 'Nový zákazník' }),
            edit: t('form.title.edit', { defaultValue: 'Upravit zákazníka' }),
          }}
          listItems={data.items}

          // fetch detail (autorita) – využijeme customers service
          fetchDetail={(id, opts) => customers.get?.(String(id), opts as any)}

          // map detail -> form defaults
          mapDetailToFormDefaults={(dto) => dtoToFormDefaults(dto as any)}

          // DETAIL (prezentační komponenta)
          renderDetail={({ id, data, loading, error, onDelete }) => (
            <Detail
              i18nNamespaces={i18nNamespaces}
              open
              onClose={closeOverlays}
              onEdit={() => openEdit(routeId as UUID)}
              onDelete={(x) => void onDelete?.(String(x) as UUID)}
              data={data as any}
              loading={loading}
              error={error ?? null}
            />
          )}

          // CREATE (form bez fetch)
          renderCreateForm={({ defaultValues, submitting, onSubmit, onCancel }) => (
            <Form
              mode="create"
              i18nNamespaces={i18nNamespaces}
              defaultValues={defaultValues}
              submitting={submitting}
              onSubmit={onSubmit}
              onCancel={onCancel}
              resetAfterSubmit
            />
          )}

          // EDIT (form s defaulty z mapDetailToFormDefaults)
          renderEditForm={({ defaultValues, submitting, onSubmit, onCancel }) => (
            <Form
              mode="edit"
              i18nNamespaces={i18nNamespaces}
              defaultValues={defaultValues}
              submitting={submitting}
              onSubmit={onSubmit}
              onCancel={onCancel}
            />
          )}

          onCreate={async (vals) => { await handleCreate(vals); }}
          onEdit={async (vals, id) => { await handleEdit(vals, id as UUID); }}
          onDelete={async (id) => { await handleDelete(id as UUID); }}
          afterMutate={refreshList}
        />
      </div>
    </div>
  );
}
