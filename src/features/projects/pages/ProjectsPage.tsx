// src/features/projects/pages/ProjectsPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ProjectsTable } from '../components/ProjectsTable';
import ProjectDetailDrawer from '../components/ProjectDetailDrawer';
import ProjectFormDrawer from '../components/ProjectFormDrawer';

import { listProjects, createProject, updateProject, archiveProject, getProject } from '../api/client';
import type { ProjectSummaryDto, ProjectDto, UUID } from '../api/types';
import { adaptSpringPage, normalizeProjectSummary } from '../mappers/ProjectsMappers';

import { Button } from '@/components/ui/stavbau-ui/button';
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate';
import { Pencil, Trash2, X, Plus } from '@/components/icons';

import { PROJECT_SCOPES } from '../const/scopes';
import ScopeGuard from '@/features/auth/guards/ScopeGuard';

import { useFab } from '@/components/layout';
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';

export default function ProjectsPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['projects', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);

  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { search: locationSearch } = useLocation();

  const [items, setItems] = React.useState<ProjectSummaryDto[]>([]);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');

  const isNew = params.id === 'new';
  const isDetail = !!params.id && params.id !== 'new';
  const isEdit = isDetail && new URLSearchParams(locationSearch).get('edit') === '1';

  // --- List (summary) ---
  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    // Preferuj serverové řazení (škáluje lépe než client sort)
    listProjects({ page, size, q: search, sort: 'name,asc' })
      .then((raw) => {
        const res = adaptSpringPage<ProjectSummaryDto>(raw);
        setItems((res.items ?? []).map(normalizeProjectSummary));
        setPage(res.page ?? page);
        setSize(res.size ?? size);
      })
      .catch((e: any) => {
        if (e?.code === 'ERR_CANCELED' || e?.name === 'AbortError') return;
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [page, size, search]);

  // --- Routing helpers ---
  const moduleBase = '/app/projects/';
  const openNew = () => navigate(`${moduleBase}new`);
  const openDetail = (id: UUID) => navigate(`${moduleBase}${id}`);
  const openEdit = (id: UUID) => navigate({ pathname: `${moduleBase}${id}`, search: '?edit=1' });
  const closeOverlays = () => navigate('/app/projects');

  const refreshList = React.useCallback(async () => {
    const raw = await listProjects({ page, size, q: search, sort: 'name,asc' });
    const res = adaptSpringPage<ProjectSummaryDto>(raw);
    setItems((res.items ?? []).map(normalizeProjectSummary));
  }, [page, size, search]);

  // --- CREATE ---
  const handleCreate = async (values: Partial<ProjectDto>) => {
    await createProject(values as any);
    closeOverlays();
    await refreshList();
  };

  // --- EDIT ---
  const handleEdit = async (values: Partial<ProjectDto>, id: UUID) => {
    await updateProject(id, values as any);
    await refreshList();
    closeOverlays();
  };

  // --- ARCHIVE (soft delete) ---
  const handleArchive = async (id: UUID) => {
    await archiveProject(id);
    await refreshList();
    closeOverlays();
  };

  // Empty state (kontext vyhledávání)
  const emptyNode = search ? (
    <EmptyState
      title={t('list.emptyTitle', { defaultValue: 'Nic jsme nenašli' })}
      description={t('list.emptyDesc', { defaultValue: 'Zkuste upravit hledaný výraz.' })}
      action={
        <Button variant="outline" leftIcon={<X size={16} />} onClick={() => setSearch('')}>
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

  // FAB: jen pokud má uživatel právo vytvářet
  React.useEffect(() => {
    const canShow = true; // ScopeGuard řešíme v buttonu níž, FAB držíme univerzální – lze rozšířit o RBAC hook
    if (canShow) {
      setFab({
        label: t('list.actions.new', { defaultValue: 'Nový projekt' }),
        onClick: () => openNew(),
        icon: <Plus className="h-6 w-6" />,
      });
    }
    return () => setFab(null);
  }, [setFab, t]);

  // rychlý prefill pro edit
  const editingProject = React.useMemo(
    () => (isEdit ? items.find((i) => i.id === params.id) : undefined),
    [isEdit, items, params.id]
  );

  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        <div className="mb-4 flex items-center justify-between gap-2 md:gap-4">
          <h1 className="text-xl font-semibold">{t('title', { defaultValue: 'Projekty' })}</h1>
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

        {/* Status (bez layout shiftu) */}
        <span className="sr-only" role="status" aria-live="polite">
          {loading ? t('loading', { defaultValue: 'Načítám…' }) : ''}
        </span>
        {!loading && error && (
          <div role="alert" className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {t('error', { defaultValue: 'Chyba načtení.' })}{' '}
            {process.env.NODE_ENV !== 'production' ? `(${error})` : null}
          </div>
        )}

        {/* TABLE */}
        <ProjectsTable
          data={items}
          loading={loading}
          i18nNamespaces={i18nNamespaces}
          className="mt-2"
          variant="surface"
          // toolbar (search řízená stránkou, DataTableV2 ji propouští dál)
          search={search}
          onSearchChange={(q) => {
            setSearch(q);
            setPage(0);
          }}
          defaultDensity="cozy"
          pageSizeOptions={[5, 10, 20]}
          // row click → detail
          onRowClick={(p) => openDetail(p.id as UUID)}
          // row actions (RBAC na stránce)
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
          canCreate={false} // tlačítko už máme nahoře + FAB (nechceme duplikovat)
          onOpenCreate={undefined}
        />

        {/* Create */}
        <ProjectFormDrawer
          mode="create"
          i18nNamespaces={i18nNamespaces}
          open={isNew}
          titleKey="form.title.create"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleCreate(vals)}
        />

        {/* Detail – natahuje si data sám (prefill pro rychlé vykreslení) */}
        <ProjectDetailDrawer
          i18nNamespaces={i18nNamespaces}
          open={isDetail && !isEdit}
          projectId={isDetail ? (params.id as UUID) : null}
          onClose={closeOverlays}
          onEdit={() => openEdit(params.id as UUID)}
          onArchive={(id) => void handleArchive(id)}
          prefill={items.find((i) => i.id === params.id) as any}
        />

        {/* Edit – form si natahuje detail sám, ale dáváme i rychlý prefill ze summary */}
        <ProjectFormDrawer
          mode="edit"
          i18nNamespaces={i18nNamespaces}
          open={!!isEdit}
          projectId={isEdit ? (params.id as UUID) : null}
          titleKey="form.title.edit"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleEdit(vals, params.id as UUID)}
          defaultValues={{
            name: items.find((i) => i.id === params.id)?.name ?? '',
            code: items.find((i) => i.id === params.id)?.code ?? '',
            description: '',
            customerId: (items.find((i) => i.id === params.id) as any)?.customerId ?? '',
            projectManagerId: (items.find((i) => i.id === params.id) as any)?.projectManagerId ?? '',
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
