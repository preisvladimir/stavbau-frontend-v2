// src/features/customers/pages/CustomersPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';

// --- App hooks & routing ---
import { useOverlayRouting } from '@/lib/router/useOverlayRouting';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';
import { useServerTableState } from '@/lib/hooks/useServerTableState';
import { useFab } from '@/components/layout';

// --- RBAC / guards ---
import { ScopeGuard, sc } from '@/rbac';
import type { UUID } from '@/types';

// --- API / service ---
import { customersService } from '@/features/customers/api/customers-service';
import type { CustomerFilters } from '@/features/customers/api/customers-service';

// --- Types ---
import type { CustomerDto, CustomerSummaryDto } from '../api/types';

// --- UI components ---
import { StbEntityTable } from '@/components/ui/stavbau-ui/datatable/StbEntityTable';
import type { DataTableV2Column } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';
import { TableHeader } from '@/components/ui/stavbau-ui/datatable/TableHeader';
import RowActions from '@/components/ui/stavbau-ui/datatable/RowActions';
import { ServerTableEmpty } from '@/components/ui/stavbau-ui/emptystate/ServerTableEmpty';
import { Button } from '@/components/ui/stavbau-ui/button';
import { CrudDrawer } from '@/components/ui/stavbau-ui/drawer/crud-drawer';

// --- Feature UI (prezentační, bez fetch) ---
import { Detail } from '../components/Detail';
import { Form } from '../components/Form';
import type { CustomerFormValues as FormValues } from '../validation/schemas';

// --- Mappers ---
import { dtoToFormDefaults, formToCreateBody, formToUpdateBody } from '../mappers/mappers';

// --- UI utils & tokens ---
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';
import { UserPlus, Plus, Mail, User as UserIcon } from '@/components/icons';

// --- Globální feedback (toast/inline rozhodování) ---
import { InlineStatus, useFeedback } from '@/ui/feedback';

export default function CustomersPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['customers', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);

  const companyId = useRequiredCompanyId();
  const customers = React.useMemo(() => customersService(companyId), [companyId]);

  const feedback = useFeedback();

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
    data,
    loading,
    //error,
    clearError,
    q,
    sort,
    size,
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
      feedback.showError(e, {
        scope: 'customers.list',
        title: t('errors.loadFailed', { defaultValue: 'Načtení selhalo' }),
      });
    },
  });

  // ---------------------------------------------------------------------------
  // Routing (new/detail/edit)
  // ---------------------------------------------------------------------------
  const {
    id: routeId, isNew, isDetail, isEdit, openNew, openDetail, openEdit, closeOverlays,
  } = useOverlayRouting({ module: 'customers' });

  // ---------------------------------------------------------------------------
  // CRUD handlery – přes FeedbackProvider (toast bez scope)
  // ---------------------------------------------------------------------------
  const handleCreate = React.useCallback(
    async (values: FormValues) => {
      await customers.create(formToCreateBody(values));
      closeOverlays();
      await refreshAfterMutation();
      feedback.show({
        severity: 'success',
        title: t('toasts.created.title', { defaultValue: 'Zákazník vytvořen' }),
      });
    },
    [customers, closeOverlays, refreshAfterMutation, feedback, t]
  );

  const handleEdit = React.useCallback(
    async (values: FormValues, id: UUID) => {
      await customers.update(id, formToUpdateBody(values));
      closeOverlays();
      await refreshList();
      feedback.show({
        severity: 'success',
        title: t('toasts.updated.title', { defaultValue: 'Uloženo' }),
      });
    },
    [customers, closeOverlays, refreshList, feedback, t]
  );

  const handleDelete = React.useCallback(
    async (id: UUID | string) => {
      try {
        await customers.remove(id as UUID);
        closeOverlays();
        await refreshList();
        feedback.show({
          severity: 'success',
          title: t('toasts.deleted.title', { defaultValue: 'Smazáno' }),
        });
      } catch (e) {
        // 403 se v showError ignoruje; ostatní projdou jako toast error
        feedback.showError(e);
        throw e;
      }
    },
    [customers, closeOverlays, refreshList, feedback, t]
  );

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  const emptyNode = (
    <ServerTableEmpty
      q={q}
      i18nNamespaces={i18nNamespaces}
      onClearSearch={() => onSearchChange('')}
      requiredScopesAnyOf={[sc.customers.create]}
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
            <ScopeGuard anyOf={[sc.customers.create]}>
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

        {/* Globální inline status pro LIST scope */}
        <InlineStatus scope="customers.list" onClear={clearError} />

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
                { kind: 'detail', onClick: () => openDetail(c.id as UUID), scopesAnyOf: [sc.customers.read] },
                { kind: 'edit', onClick: () => openEdit(c.id as UUID), scopesAnyOf: [sc.customers.update] },
                {
                  kind: 'delete',
                  onClick: () => handleDelete(c.id as UUID),
                  scopesAnyOf: [sc.customers.delete],
                  confirm: {
                    title: t('list.confirm.delete.title', { defaultValue: 'Smazat zákazníka?' }),
                    description: t('list.confirm.delete.desc', { defaultValue: 'Tato akce je nevratná.' }),
                    confirmLabel: t('common:delete', { defaultValue: 'Smazat' }),
                    cancelLabel: t('common:cancel', { defaultValue: 'Zrušit' }),
                  },
                },
              ]}
            />
          )}
          emptyContent={emptyNode}
        />

        {/* --- Orchestrátor detail/create/edit --- */}
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
          fetchDetail={(id, opts) => customers.get?.(id as UUID, opts as any)}
          mapDetailToFormDefaults={(dto) => dtoToFormDefaults(dto as CustomerDto)}
          renderDetail={({ data, loading, error, onDelete }) => (
            <Detail
              i18nNamespaces={i18nNamespaces}
              open
              onClose={closeOverlays}
              onEdit={() => openEdit(routeId as UUID)}
              onDelete={(x) => void onDelete?.(String(x))}
              data={data as any}
              loading={loading}
              error={error ?? null}
            />
          )}
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
