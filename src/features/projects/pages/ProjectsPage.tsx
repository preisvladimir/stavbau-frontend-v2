// src/features/projects/pages/ProjectsPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ProjectsTable } from '../components/ProjectsTable';
import ProjectDetailDrawer from '../components/ProjectDetailDrawer';
import ProjectFormDrawer from '../components/ProjectFormDrawer';

import { listProjects, createProject, updateProject, archiveProject } from '../api/client';
import type { ProjectSummaryDto, ProjectDto, UUID } from '../api/types';

import { useServerTableState } from '@/lib/hooks/useServerTableState';

import { Button } from '@/components/ui/stavbau-ui/button';
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate';
import { Pencil, Trash2, X, Plus } from '@/components/icons';

import { PROJECT_SCOPES } from '../const/scopes';
import ScopeGuard from '@/features/auth/guards/ScopeGuard';

import { useFab } from '@/components/layout';
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';

/**
 * Stránka „Projects“:
 * - Server-side tabulka (q/page/size/sort) přes useServerTableState
 * - CRUD akce (create, edit, archive)
 * - Detail / Form v "drawer" režimu (řízeno přes URL)
 */
export default function ProjectsPage() {
  // ---------------------------------------------------------------------------
  // i18n & layout
  // ---------------------------------------------------------------------------
  const i18nNamespaces = React.useMemo<string[]>(() => ['projects', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);
  const { setFab } = useFab();

  // ---------------------------------------------------------------------------
  // Routing
  // ---------------------------------------------------------------------------
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { search: locationSearch } = useLocation();

  const moduleBase = React.useMemo(() => '/app/projects/', []);
  const openNew = React.useCallback(() => navigate(`${moduleBase}new`), [navigate, moduleBase]);
  const openDetail = React.useCallback((id: UUID) => navigate(`${moduleBase}${id}`), [navigate, moduleBase]);
  const openEdit = React.useCallback(
    (id: UUID) => navigate({ pathname: `${moduleBase}${id}`, search: '?edit=1' }),
    [navigate, moduleBase]
  );
  const closeOverlays = React.useCallback(() => navigate('/app/projects'), [navigate]);

  const isNew = params.id === 'new';
  const isDetail = !!params.id && params.id !== 'new';
  const isEdit = isDetail && new URLSearchParams(locationSearch).get('edit') === '1';

  // ---------------------------------------------------------------------------
  // Server-side řízení tabulky (unifikovaný hook)
  // - fetcher stabilizovaný přes useCallback, aby se nespouštěl loop
  // - default sort na existující sloupec `code`
  // ---------------------------------------------------------------------------
  const fetcher = React.useCallback(
    ({ q, page, size, sort }: { q?: string; page?: number; size?: number; sort?: string | string[] }) =>
      listProjects({ q, page, size, sort }),
    []
  );

  const {
    data, loading,
    q, sort, page, size,
    onSearchChange, onSortChange, onPageChange, onPageSizeChange,
    refreshList, refreshAfterMutation,
  } = useServerTableState<ProjectSummaryDto>({
    fetcher,
    defaults: { q: '', page: 0, size: 20, sort: [{ id: 'code', desc: false }] },
  });

  // Vybraný projekt (pro detail/form) – memoizace pro rychlý lookup
  const selectedItem = React.useMemo<ProjectSummaryDto | undefined>(
    () => data.items.find((i) => i.id === params.id),
    [data.items, params.id]
  );

  // UI stav chyb (rezerva pro budoucí globální error boundary)
  const [error, setError] = React.useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // CRUD Handlery
  // - create → reset na 1. stránku (refreshAfterMutation)
  // - edit/archive → zůstaň na aktuální stránce (refreshList)
  // ---------------------------------------------------------------------------
  const handleCreate = React.useCallback(
    async (values: Partial<ProjectDto>) => {
      try {
        await createProject(values as ProjectDto);
        closeOverlays();
        await refreshAfterMutation();
      } catch (e: any) {
        setError(e?.message ?? 'Create failed');
      }
    },
    [closeOverlays, refreshAfterMutation]
  );

  const handleEdit = React.useCallback(
    async (values: Partial<ProjectDto>, id: UUID) => {
      try {
        await updateProject(id, values as ProjectDto);
        closeOverlays();
        await refreshList();
      } catch (e: any) {
        setError(e?.message ?? 'Update failed');
      }
    },
    [closeOverlays, refreshList]
  );

  const handleArchive = React.useCallback(
    async (id: UUID) => {
      try {
        await archiveProject(id);
        closeOverlays();
        await refreshList();
      } catch (e: any) {
        setError(e?.message ?? 'Archive failed');
      }
    },
    [closeOverlays, refreshList]
  );

  // ---------------------------------------------------------------------------
  // Empty state – respektuje, zda je aktivní vyhledávání (q)
  // ---------------------------------------------------------------------------
  const emptyNode = q ? (
    <EmptyState
      title={t('list.emptyTitle', { defaultValue: 'Nic jsme nenašli' })}
      description={t('list.emptyDesc', { defaultValue: 'Zkuste upravit hledaný výraz.' })}
      action={
        <Button variant="outline" leftIcon={<X size={16} />} onClick={() => onSearchChange('')}>
          {t('list.actions.open', { defaultValue: 'Zrušit hledání' })}
        </Button>
      }
    />
  ) : (
    <EmptyState
      title={t('list.emptyTitle', { defaultValue: 'Zatím žádné projekty' })}
      description={t('list.emptyDesc', { defaultValue: 'Přidejte první projekt.' })}
      action={
        <ScopeGuard anyOf={[PROJECT_SCOPES.CREATE]}>
          <Button leftIcon={<Plus size={16} />} onClick={openNew}>
            {t('list.actions.new', { defaultValue: 'Nový projekt' })}
          </Button>
        </ScopeGuard>
      }
    />
  );

  // ---------------------------------------------------------------------------
  // FAB – rychlý přístup k vytvoření projektu
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
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        <div className="mb-4 flex items-center justify-between gap-2 md:gap-4">
          <h1 className="text-xl font-semibold">
            {t('title', { defaultValue: 'Projekty' })}
          </h1>

          {/* Primární CTA (na desktopu mimo tabulku, na mobilu FAB) */}
          <div className="hidden min-w-0 w-full md:w-auto md:flex items-center gap-2 md:gap-3">
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
          </div>
        </div>

        {/* Status (bez layout shiftu, pro screen readery) */}
        <span className="sr-only" role="status" aria-live="polite">
          {loading ? t('loading', { defaultValue: 'Načítám…' }) : ''}
        </span>

        {/* Chyby (dev režim ukáže detail) */}
        {!loading && error && (
          <div role="alert" className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {t('error', { defaultValue: 'Chyba načtení.' })}{' '}
            {process.env.NODE_ENV !== 'production' ? `(${error})` : null}
          </div>
        )}

        {/* Tabulka projektů (server-side řízená) */}
        <ProjectsTable
          data={data.items}
          loading={loading}
          page={page}
          pageSize={size}
          totalItems={data.total}
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
          rowActions={(p) => (
            <div className="flex items-center gap-2">
              <ScopeGuard anyOf={[PROJECT_SCOPES.UPDATE]}>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={t('detail.actions.edit') as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(p.id as UUID);
                  }}
                  title={t('detail.actions.edit') as string}
                >
                  <Pencil size={16} />
                </Button>
              </ScopeGuard>
              <ScopeGuard anyOf={[PROJECT_SCOPES.ARCHIVE]}>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label={t('detail.actions.archive') as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleArchive(p.id as UUID);
                  }}
                  title={t('detail.actions.archive') as string}
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
        />

        {/* Drawer: Create */}
        <ProjectFormDrawer
          mode="create"
          i18nNamespaces={i18nNamespaces}
          open={isNew}
          titleKey="form.title.create"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleCreate(vals)}
        />

        {/* Drawer: Detail */}
        <ProjectDetailDrawer
          i18nNamespaces={i18nNamespaces}
          open={isDetail && !isEdit}
          projectId={isDetail ? (params.id as UUID) : null}
          onClose={closeOverlays}
          onEdit={() => openEdit(params.id as UUID)}
          onArchive={(id) => void handleArchive(id)}
          prefill={selectedItem as any}
        />

        {/* Drawer: Edit */}
        <ProjectFormDrawer
          mode="edit"
          i18nNamespaces={i18nNamespaces}
          open={!!isEdit}
          projectId={isEdit ? (params.id as UUID) : null}
          titleKey="form.title.edit"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleEdit(vals, params.id as UUID)}
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
