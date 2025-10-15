// src/features/projects/pages/ProjectsPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';

// --- App hooks & routing ---
import { useOverlayRouting } from '@/lib/router/useOverlayRouting';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';
import { useFab } from '@/components/layout';

// --- API / services & types ---
import { projectsService } from '@/features/projects/api/projects-service';
import type { ProjectFilters } from '@/features/projects/api/projects-service';
import type { ProjectSummaryDto, ProjectDto } from '../api/types';
import type { UUID } from '@/types';
import { useServerTableState } from '@/lib/hooks/useServerTableState';

// --- UI components ---
import {
  Button,
  StbEntityTable,
  TableHeader,
  RowActions,
  ServerTableEmpty,
  type DataTableV2Column,
} from '@/ui';

// --- RBAC / guards ---
import { ScopeGuard, sc } from '@/rbac';

// --- UI utils & tokens ---
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/ui';
import { Plus } from '@/components/icons';

// --- Drawer orchestrátor & stránky ---
import { CrudDrawer } from '@/components/ui/stavbau-ui/drawer/crud-drawer';
import Detail from '../components/Detail';
import { Form } from '../components/Form';

// --- Mappers / form types ---
import type { AnyProjectFormValues } from '../validation/schemas';
import {
  dtoToFormDefaults,
  formToCreateBody,
  formToUpdateBody,
} from '../mappers/ProjectsMappers';

// --- Globální feedback (toast/inline rozhodování) ---
import { InlineStatus, useFeedback } from '@/ui/feedback';

export default function ProjectsPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['projects', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);

  const companyId = useRequiredCompanyId();
  const projectSvc = React.useMemo(() => projectsService(companyId), [companyId]);

  // Jedna scope pro stránku (list)
  const feedback = useFeedback();
  const scope = 'projects.list';

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
    //error,
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
      page: 0,
      size: 10,
      sort: [{ id: 'name', desc: false }],
      filters: { status: '' },
    },
    onError: (e) => {
      feedback.showError(e, {
        scope,
        title: t('errors.loadFailed', { defaultValue: 'Načtení selhalo' }),
      });
    },
  });

  // ---------------------------------------------------------------------------
  // Routing (new/detail/edit overlay)
  // ---------------------------------------------------------------------------
  const { id: routeId, isNew, isDetail, isEdit, openNew, openDetail, openEdit, closeOverlays } =
    useOverlayRouting({ module: 'projects' });

  // ---------------------------------------------------------------------------
  // CRUD handlery – přes feedback.show()
  // ---------------------------------------------------------------------------
  const handleCreate = React.useCallback(
    async (values: AnyProjectFormValues) => {
      await projectSvc.create(formToCreateBody(values));
      closeOverlays();
      await refreshAfterMutation(); // po create skoč na 1. stránku
      feedback.show({
        severity: 'success',
        title: t('toasts.created.title', { defaultValue: 'Projekt vytvořen' }),
        scope,
      });
    },
    [projectSvc, closeOverlays, refreshAfterMutation, feedback, scope, t]
  );

  const handleEdit = React.useCallback(
    async (values: AnyProjectFormValues, id: UUID) => {
      await projectSvc.update(id, formToUpdateBody(values));
      closeOverlays();
      await refreshList();
      feedback.show({
        severity: 'success',
        title: t('toasts.updated.title', { defaultValue: 'Uloženo' }),
        scope,
      });
    },
    [projectSvc, closeOverlays, refreshList, feedback, scope, t]
  );

  const handleArchive = React.useCallback(
    async (id: UUID) => {
      try {
        await projectSvc.archive(id);
        closeOverlays();
        await refreshList();
        feedback.show({
          severity: 'success',
          title: t('toasts.archived.title', { defaultValue: 'Archivováno' }),
          scope,
        });
      } catch (e) {
        // 403 typicky zachytí globální guard; showError jej tiše ignoruje/transformuje
        feedback.showError(e, {
          scope,
          title: t('errors.archiveFailed', { defaultValue: 'Archivace selhala' }),
        });
        throw e;
      }
    },
    [projectSvc, refreshList, closeOverlays, feedback, scope, t]
  );

  // ---------------------------------------------------------------------------
  // Empty state – respektuje aktivní vyhledávání (q)
  // ---------------------------------------------------------------------------
  const emptyNode = (
    <ServerTableEmpty
      q={q}
      i18nNamespaces={i18nNamespaces}
      onClearSearch={() => onSearchChange('')}
      requiredScopesAnyOf={[sc.projects.write, sc.projects.create]}
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

  // ---------------------------------------------------------------------------
  // Sloupce tabulky
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
            <ScopeGuard anyOf={[sc.projects.create]}>
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

        {/* Globální inline status pro tuto stránku */}
        <InlineStatus scope={scope} onClear={clearError} />

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
                { kind: 'detail', onClick: () => openDetail(m.id as UUID), scopesAnyOf: [sc.projects.read] },
                { kind: 'edit', onClick: () => openEdit(m.id as UUID), scopesAnyOf: [sc.projects.update] },
                {
                  kind: 'archive',
                  onClick: () => handleArchive(m.id as UUID),
                  scopesAnyOf: [sc.projects.archive],
                  confirm: {
                    title: t('list.confirm.archive.title', { defaultValue: 'Archivovat projekt?' }),
                    description: t('list.confirm.archive.desc', { defaultValue: 'Projekt bude skryt z hlavního výpisu.' }),
                    confirmLabel: t('common:archive', { defaultValue: 'Archivovat' }),
                    cancelLabel: t('common:cancel', { defaultValue: 'Zrušit' }),
                  },
                },
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
          fetchDetail={(id, opts) => projectSvc.get?.(id as UUID, opts as any)}

          mapDetailToFormDefaults={(dto) => dtoToFormDefaults(dto as ProjectDto)}

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
              companyId={companyId as UUID}
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
              companyId={companyId as UUID}
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
          onDelete={async (_id) => { /* volitelné – pokud přidáš delete */ }}
          afterMutate={refreshList}
        />
      </div>
    </div>
  );
}
