// src/features/projects/pages/ProjectsPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';

// --- App hooks & routing ---
import { useOverlayRouting } from '@/lib/router/useOverlayRouting';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';
import { useServerTableState } from '@/lib/hooks/useServerTableState';
import { useFab } from '@/components/layout';

// --- API / services & types ---
import { projectsService } from '@/features/projects/api/projects-service';
import type { ProjectFilters } from '@/features/projects/api/projects-service';
import type { ProjectSummaryDto, ProjectDto, UUID } from '../api/types';

// --- UI components ---
import { StbEntityTable } from '@/components/ui/stavbau-ui/datatable/StbEntityTable';
import type { DataTableV2Column } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';
import { TableHeader } from '@/components/ui/stavbau-ui/datatable/TableHeader';
import RowActions from '@/components/ui/stavbau-ui/datatable/RowActions';
import { ServerTableEmpty } from '@/components/ui/stavbau-ui/emptystate/ServerTableEmpty';
import LoadErrorStatus from '@/components/ui/stavbau-ui/feedback/LoadErrorStatus';
import { Button } from '@/components/ui/stavbau-ui/button';

// --- RBAC / guards ---
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { PROJECT_SCOPES } from '../const/scopes';

// --- UI utils & tokens ---
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';
import { Plus } from '@/components/icons';

import { CrudDrawer } from '@/components/ui/stavbau-ui/drawer/crud-drawer'; // orchestrátor
import Detail from '../components/Detail';
import { Form } from '../components/Form';
import type { AnyProjectFormValues } from '../validation/schemas';

export default function ProjectsPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['projects', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);

  const companyId = useRequiredCompanyId();
  const projectSvc = React.useMemo(() => projectsService(companyId), [companyId]);

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
      filters?: ProjectFilters;
    }) =>
      projectSvc.list({
        q,
        page,
        size,
        sort,
        filters, // wrapper přes filtersToQuery převede { status }
      }),
    [projectSvc]
  );

  const {
    data,
    loading,
    error,
    clearError,
    q,
    sort,
    size,
    page1,
    total,
    onSearchChange,
    onSortChange,
    onPageChange,
    onPageSizeChange,
    refreshList,
    refreshAfterMutation,
  } = useServerTableState<ProjectSummaryDto, ProjectFilters>({
    fetcher,
    defaults: {
      q: '',
      page: 0, // interně 0-based, hook vystavuje i page1 (1-based) pro UI
      size: 10,
      sort: [{ id: 'name', desc: false }],
      filters: { status: '' },
    },
    onError: (e) => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[ProjectsPage] load error', e);
      }
    },
  });

  // ---------------------------------------------------------------------------
  // Routing (new/detail/edit overlay)
  // ---------------------------------------------------------------------------
  const { id: routeId, isNew, isDetail, isEdit, openNew, openDetail, openEdit, closeOverlays } =
    useOverlayRouting({ module: 'projects' });

  // ---------------------------------------------------------------------------
  // CRUD handlery
  // ---------------------------------------------------------------------------
  const handleCreate = React.useCallback(
    async (values: Partial<ProjectDto>) => {
      await projectSvc.create(values as any);
      closeOverlays();
      await refreshAfterMutation(); // po create skoč na 1. stránku
    },
    [projectSvc, closeOverlays, refreshAfterMutation]
  );

  const handleEdit = React.useCallback(
    async (values: Partial<ProjectDto>, id: UUID) => {
      await projectSvc.update(id, values as any);
      closeOverlays();
      await refreshList();
    },
    [projectSvc, closeOverlays, refreshList]
  );

  const handleArchive = React.useCallback(
    async (id: UUID) => {
      await projectSvc.archive(id);
      closeOverlays();
      await refreshList();
    },
    [projectSvc, closeOverlays, refreshList]
  );

  // ---------------------------------------------------------------------------
  // Empty state – respektuje aktivní vyhledávání (q)
  // ---------------------------------------------------------------------------
  const emptyNode = (
    <ServerTableEmpty
      q={q}
      i18nNamespaces={i18nNamespaces}
      onClearSearch={() => onSearchChange('')}
      requiredScopesAnyOf={[PROJECT_SCOPES.RW, PROJECT_SCOPES.CREATE]}
      emptyAction={
        <Button leftIcon={<Plus size={16} />} onClick={openNew}>
          {t('list.actions.new', { defaultValue: 'Nový projekt' })}
        </Button>
      }
    />
  );

  // ---------------------------------------------------------------------------
  // FAB – primární CTA (Nový projekt)
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    setFab({
      label: t('list.actions.new', { defaultValue: 'Nový projekt' }),
      onClick: openNew,
      icon: <Plus className="h-6 w-6" />,
    });
    return () => setFab(null);
  }, [setFab, t, openNew]);

  // Vybraný projekt (pro rychlý prefill do formu/detailu)
  const selectedItem = React.useMemo<ProjectSummaryDto | null>(
    () => (routeId ? data.items.find((i) => String(i.id) === routeId) ?? null : null),
    [data.items, routeId]
  );

  // ---------------------------------------------------------------------------
  // Sloupce tabulky (původně v ProjectsTable) – nyní lokálně pro StbEntityTable
  // ---------------------------------------------------------------------------
  const columns = React.useMemo<DataTableV2Column<ProjectSummaryDto>[]>(() => [
    { id: 'createdAt', header: t('columns.createdAt', { defaultValue: 'Vytvořeno' }), accessor: (p) => p.createdAt, sortable: true, width: 140 },
    { id: 'code', header: t('columns.code', { defaultValue: 'Kód' }), accessor: (p) => p.code, sortable: true, width: 120 },
    { id: 'name', header: t('columns.name', { defaultValue: 'Název' }), accessor: (p) => p.name, sortable: true, minWidth: 220 },
    { id: 'customerName', header: t('columns.customer', { defaultValue: 'Zákazník' }), accessor: (p) => p.customerName, sortable: true, minWidth: 200 },
    { id: 'plannedStartDate', header: t('columns.plannedStart', { defaultValue: 'Plán. start' }), accessor: (p) => p.plannedStartDate, sortable: true, width: 130 },
    { id: 'plannedEndDate', header: t('columns.plannedEnd', { defaultValue: 'Plán. konec' }), accessor: (p) => p.plannedEndDate, sortable: true, width: 130 },
    { id: 'status', header: t('columns.status', { defaultValue: 'Stav' }), accessor: (p) => p.status, sortable: true, width: 120 },
  ], [t]);

  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        {/* Table Header */}
        <TableHeader
          title={t('title', { defaultValue: 'Projekty' })}
          subtitle={t('subtitle', { defaultValue: 'Správa projektů' })}
          actions={
            <ScopeGuard anyOf={[PROJECT_SCOPES.CREATE]}>
              <Button
                type="button"
                variant="primary"
                onClick={openNew}
                disabled={loading}
                ariaLabel={t('actions.newProject', { defaultValue: 'Nový projekt' }) as string}
                leftIcon={<Plus size={16} />}
                className="shrink-0 whitespace-nowrap"
              >
                <span>{t('actions.newProject', { defaultValue: 'Nový projekt' })}</span>
              </Button>
            </ScopeGuard>
          }
        />

        {/* Status */}
        <LoadErrorStatus
          loading={loading}
          error={error}
          onClear={clearError}
          i18nNamespaces={i18nNamespaces}
        />

        {/* Tabulka projektů (server-side řízená) – StbEntityTable */}
        <StbEntityTable<ProjectSummaryDto>
          // i18n / vzhled
          i18nNamespaces={i18nNamespaces}
          className="mt-2"
          variant="surface"
          defaultDensity="cozy"
          pageSizeOptions={[5, 10, 20]}

          // data & řízení (1-based page)
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

          // vyhledávání
          search={q}
          onSearchChange={onSearchChange}

          // sloupce
          columns={columns}
          keyField={(p) => String(p.id)}

          // interakce s řádky
          onRowClick={(p) => openDetail(p.id as UUID)}
          rowActions={(m) => (
            <RowActions
              item={m}
              asMenu
              maxInline={2}
              i18nNamespaces={i18nNamespaces}
              menuLabel={t('list.actions.title', { defaultValue: 'Akce' })}
              actions={[
                { kind: 'detail', onClick: () => openDetail(m.id as UUID), scopesAnyOf: [PROJECT_SCOPES.READ] },
                { kind: 'edit', onClick: () => openEdit(m.id as UUID), scopesAnyOf: [PROJECT_SCOPES.UPDATE] },
                {
                  kind: 'archive',
                  onClick: () => handleArchive(m.id as UUID),
                  scopesAnyOf: [PROJECT_SCOPES.ARCHIVE],
                  confirm: {},
                },
                // případně delete:
                // { kind: 'delete', onClick: () => projectSvc.remove(m.id as UUID), scopesAnyOf: [PROJECT_SCOPES.DELETE], confirm: {} },
              ]}
            />
          )}

          // empty state
          emptyContent={emptyNode}
        />
<CrudDrawer<ProjectSummaryDto, AnyProjectFormValues>
  isDetail={isDetail && !isEdit}
  isNew={isNew}
  isEdit={!!isEdit}
  entityId={isDetail || isEdit ? (routeId as UUID) : null}
  onClose={closeOverlays}
  titles={{
    detail: t('detail.title', { defaultValue: 'Detail projektu' }),
    create: t('form.title.create', { defaultValue: 'Nový projekt' }),
    edit: t('form.title.edit', { defaultValue: 'Upravit projekt' }),
  }}

  // rychlý prefill ze seznamu
  listItems={data.items}

  // autoritativní fetch detailu
  fetchDetail={(id, opts) => projectSvc.get?.(String(id), opts as any)}

  // map detail -> form defaults (stejné jako ve stávajícím ProjectFormDrawer)
  mapDetailToFormDefaults={(p) => {
    const normalizeAddress = (a?: any) => {
      if (!a) return undefined;
      const cleaned = Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v ?? undefined]));
      const anyVal = Object.values(cleaned).some((v: any) =>
        typeof v === 'string' ? v.trim().length > 0 : v != null
      );
      return anyVal ? (cleaned as any) : undefined;
    };
    return {
      name: p?.name ?? '',
      code: p?.code ?? '',
      description: p?.description ?? '',
      plannedStartDate: p?.plannedStartDate ?? '',
      plannedEndDate: p?.plannedEndDate ?? '',
      currency: p?.currency ?? '',
      vatMode: p?.vatMode ?? '',
      siteAddress: normalizeAddress(p?.siteAddress),
      customerId: p?.customerId ?? '',
      projectManagerId: p?.projectManagerId ?? '',
      // nevalidované "label" hodnoty pro AsyncSearchSelect:
      customerLabel: p?.customerName ?? undefined,
      projectManagerLabel: p?.projectManagerName ?? undefined,
    } as Partial<AnyProjectFormValues>;
  }}

  // DETAIL – prezentace nad StbDrawer, žádný fetch v komponentě
  renderDetail={({ data, loading, error }) => (
    <Detail
      i18nNamespaces={i18nNamespaces}
      open
      onClose={closeOverlays}
      onEdit={() => openEdit(routeId as UUID)}
      onArchive={(id) => void handleArchive(id as UUID)}
      // onUnarchive? pokud přidáš endpoint
      data={data as any}
      loading={loading}
      error={error ?? null}
    />
  )}

  // CREATE
  renderCreateForm={({ defaultValues, submitting, onSubmit, onCancel }) => (
    <Form
    companyId={companyId}
      mode="create"
      i18nNamespaces={i18nNamespaces}
      defaultValues={defaultValues}
      submitting={submitting}
      onSubmit={onSubmit}
      onCancel={onCancel}
      resetAfterSubmit
    />
  )}

  // EDIT
  renderEditForm={({ defaultValues, submitting, onSubmit, onCancel }) => (
    <Form
      companyId={companyId}
      mode="edit"
      i18nNamespaces={i18nNamespaces}
      defaultValues={defaultValues}
      submitting={submitting}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  )}

  // akce
  onCreate={async (vals) => { await handleCreate(vals); }}
  onEdit={async (vals, id) => { await handleEdit(vals, id as UUID); }}
  onDelete={async (id) => { /* volitelné – pokud přidáš delete */ }}
  afterMutate={refreshList}
/>
      </div>
    </div>
  );
}
