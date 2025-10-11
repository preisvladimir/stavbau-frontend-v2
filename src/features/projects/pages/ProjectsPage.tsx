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
import { ProjectsTable } from '../components/ProjectsTable';
import ProjectDetailDrawer from '../components/ProjectDetailDrawer';
import ProjectFormDrawer from '../components/ProjectFormDrawer';
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
      page: 0,
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

        {/* Tabulka projektů (server-side řízená) */}
        <ProjectsTable
          data={data.items}
          loading={loading}
          page={page1}
          pageSize={size}
          total={total}        
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
          emptyContent={emptyNode}
          // Create skrze FAB / primární CTA nahoře
          canCreate={false}
          onOpenCreate={undefined}
        />

        {/* Drawer: Create */}
        <ProjectFormDrawer
          mode="create"
          i18nNamespaces={i18nNamespaces}
          companyId={companyId}
          open={isNew}
          titleKey="form.title.create"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleCreate(vals)}
        />

        {/* Drawer: Detail */}
        <ProjectDetailDrawer
          i18nNamespaces={i18nNamespaces}
          companyId={companyId}
          open={isDetail && !isEdit}
          projectId={isDetail ? (routeId as UUID) : null}
          onClose={closeOverlays}
          onArchive={(id) => void handleArchive(id)}
          onEdit={() => openEdit(routeId as UUID)}
          prefill={selectedItem ?? undefined}
        />

        {/* Drawer: Edit */}
        <ProjectFormDrawer
          mode="edit"
          i18nNamespaces={i18nNamespaces}
          companyId={companyId}
          open={!!isEdit}
          projectId={isEdit ? (routeId as UUID) : null}
          titleKey="form.title.edit"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleEdit(vals, routeId as UUID)}
          defaultValues={{
            name: selectedItem?.name ?? '',
            code: selectedItem?.code ?? '',
            description: '',
            customerId: (selectedItem as any)?.customerId ?? '',
            projectManagerId: (selectedItem as any)?.projectManagerId ?? '',
            plannedStartDate: '',
            plannedEndDate: '',
            currency: '',
            vatMode: '',
          }}
        />
      </div>
    </div>
  );
}
