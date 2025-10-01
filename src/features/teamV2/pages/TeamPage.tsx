import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';

import { TeamTable } from '../components/TeamTable';
import { TeamDetailDrawer } from '../components/TeamDetailDrawer';
import { TeamFormDrawer } from '../components/TeamFormDrawer';

import {
  listMemberSummaries,
  createMember,
  updateMemberProfile,
  updateMemberRole,
  deleteMember,
} from '../api/client';

import type { MemberSummaryDto, UUID } from '../api/types';
import type { CompanyRoleName } from '@/types/common/rbac';
import { formToCreateBody, formToUpdateProfileBody } from '../mappers';
import type { AnyTeamFormValues } from '../validation/schemas';

import { Button } from '@/components/ui/stavbau-ui/button';
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate';
import { UserPlus, Pencil, Trash2, X, Plus } from '@/components/icons';
import { TEAM_SCOPES } from '../teamScopes';
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { useFab } from '@/components/layout';
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';

export default function TeamPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo(() => ['team', 'common'] as const, []);
  const { t } = useTranslation(i18nNamespaces);
  const companyId = useRequiredCompanyId();

  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { search: locationSearch } = useLocation();

  const [items, setItems] = React.useState<MemberSummaryDto[]>([]);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');

  const isNew = params.id === 'new';
  const isDetail = !!params.id && params.id !== 'new';
  const isEdit = isDetail && new URLSearchParams(locationSearch).get('edit') === '1';

  // List (summary)
  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    listMemberSummaries(companyId, { page, size, q: search, signal: ac.signal })
      .then((res) => {
        const sorted = [...res.items].sort((a, b) => {
          const an = [a.firstName, a.lastName].filter(Boolean).join(' ') || a.displayName || a.email;
          const bn = [b.firstName, b.lastName].filter(Boolean).join(' ') || b.displayName || b.email;
          return an.localeCompare(bn);
        });
        setItems(sorted);
        setPage(res.page);
        setSize(res.size);
      })
      .catch((e) => {
        if (e?.code === 'ERR_CANCELED' || e?.name === 'AbortError') return;
        setError(e?.response?.data?.detail ?? 'Failed to load');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [companyId, page, size, search]);

  const moduleBase = '/app/team/';
  const openNew = () => navigate(`${moduleBase}new`);
  const openDetail = (id: UUID) => navigate(`${moduleBase}${id}`);
  const openEdit = (id: UUID) => navigate({ pathname: `${moduleBase}${id}`, search: '?edit=1' });
  const closeOverlays = () => navigate('/app/team');

  const refreshList = React.useCallback(async () => {
    const res = await listMemberSummaries(companyId, { page, size, q: search });
    setItems(res.items);
  }, [companyId, page, size, search]);

  // CREATE
  const handleCreate = async (values: AnyTeamFormValues) => {
    await createMember(companyId, formToCreateBody(values));
    closeOverlays();
    await refreshList();
  };

  // EDIT: role zvlášť, profil zvlášť
  const handleEdit = async (values: AnyTeamFormValues, id: UUID) => {
    const current = items.find((i) => i.id === id);
    const newRole = (values.companyRole ?? values.role) as CompanyRoleName | undefined;
    const prevRole = current?.companyRole ?? null;

    // 1) Role – jen když se opravdu změnila
    if (newRole && newRole !== prevRole) {
      await updateMemberRole(companyId, id, { role: newRole });
    }

    // 2) Profil – pošli jen profilová pole
    const profile = formToUpdateProfileBody(values);
    if (hasProfileChanges(profile)) {
      await updateMemberProfile(companyId, id, profile);
    }

    await refreshList();
    closeOverlays();
  };

  // malý helper na „je co posílat?“
  function hasProfileChanges(obj: Record<string, any>) {
    return Object.values(obj).some(
      (v) => v !== undefined && v !== null && String(v).trim() !== ''
    );
  }

  // DELETE
  const handleDelete = async (id: UUID) => {
    await deleteMember(companyId, id);
    closeOverlays();
    await refreshList();
  };

  // Empty state (kontext vyhledávání)
  const emptyNode = search ? (
    <EmptyState
      title={t('list.emptyTitle')}
      description={t('list.emptyDesc')}
      action={
        <Button variant="outline" leftIcon={<X size={16} />} onClick={() => setSearch('')}>
          {t('list.actions.open')}
        </Button>
      }
    />
  ) : (
    <EmptyState
      title={t('list.emptyTitle')}
      description={t('list.emptyDesc')}
      action={
        <ScopeGuard anyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.ADD]}>
          <Button leftIcon={<UserPlus size={16} />} onClick={openNew}>
            {t('list.actions.add')}
          </Button>
        </ScopeGuard>
      }
    />
  );

  // FAB
  React.useEffect(() => {
    setFab({
      label: t('list.actions.add'),
      onClick: () => openNew(),
      icon: <Plus className="h-6 w-6" />,
    });
    return () => setFab(null);
  }, [setFab, t]);

  const editingMember = React.useMemo(
    () => (isEdit ? items.find(i => i.id === params.id) : undefined),
    [isEdit, items, params.id]
  );

  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        <div className="mb-4 flex items-center justify-between gap-2 md:gap-4">
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <div className="hidden md:flex items-center gap-2 md:gap-3 w-full md:w-auto min-w-0">
            <ScopeGuard anyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.ADD]}>
              <Button
                type="button"
                variant="primary"
                onClick={() => openNew()}
                disabled={loading}
                ariaLabel={t('actions.newUser', { defaultValue: 'Nový uživatel' }) as string}
                leftIcon={<UserPlus size={16} />}
                className="shrink-0 whitespace-nowrap"
              >
                <span>{t('actions.newUser', { defaultValue: 'Nový uživatel' })}</span>
              </Button>
            </ScopeGuard>
          </div>
        </div>

        {/* Status (bez layout shiftu): 
          - Loading oznamujeme jen SR (DataTableV2 řeší overlay uvnitř).
          - Error ukazujeme vizuálně (má smysl posunout obsah). */}
        <span className="sr-only" role="status" aria-live="polite">
          {loading ? t('loading', { defaultValue: 'Načítám…' }) : ''}
        </span>
        {!loading && error && (
          <div
            role="alert"
            className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700"
          >
            {t('error', { defaultValue: 'Chyba načtení.' })}{' '}
            {process.env.NODE_ENV !== 'production' ? `(${error})` : null}
          </div>
        )}

        <TeamTable
          data={items}
          loading={loading}
          i18nNamespaces={i18nNamespaces as unknown as string[]}
          className="mt-2"
          variant="surface"
          // toolbar (search řízená stránkou, DataTableV2 ji propouští dál)
          search={search}
          onSearchChange={setSearch}
          defaultDensity="cozy"
          pageSizeOptions={[5, 10, 20]}
          // row click → detail
          onRowClick={(m) => openDetail(m.id as UUID)}
          // row actions (RBAC na stránce)
          rowActions={(m) => (
            <div className="flex items-center gap-2">
              <ScopeGuard anyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.UPDATE]}>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={t('detail.actions.edit') as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(m.id as UUID);
                  }}
                  title={t('detail.actions.edit') as string}
                >
                  <Pencil size={16} />
                </Button>
              </ScopeGuard>
              <ScopeGuard anyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.REMOVE]}>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label={t('detail.actions.delete') as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(m.id as UUID);
                  }}
                  title={t('detail.actions.delete') as string}
                >
                  <Trash2 size={16} />
                </Button>
              </ScopeGuard>
            </div>
          )}
          emptyContent={emptyNode}
        />

        {/* Create */}
        <TeamFormDrawer
          mode="create"
          i18nNamespaces={i18nNamespaces as unknown as string[]}
          open={isNew}
          companyId={companyId}
          titleKey="form.title.create"
          onClose={closeOverlays}
          onSubmit={handleCreate}
        />

        {/* Detail – natahuje si data sama (prefill pro rychlé vykreslení) */}
        <TeamDetailDrawer
          i18nNamespaces={i18nNamespaces as unknown as string[]}
          open={isDetail && !isEdit}
          companyId={companyId}
          memberId={isDetail ? (params.id as UUID) : null}
          onClose={closeOverlays}
          onEdit={() => openEdit(params.id as UUID)}
          onDelete={(id) => void handleDelete(id)}
          prefill={items.find((i) => i.id === params.id) as any}
        />

        {/* Edit – form si natahuje detail sám, ale dáváme i rychlý prefill ze summary */}
        <TeamFormDrawer
          mode="edit"
          i18nNamespaces={i18nNamespaces as unknown as string[]}
          open={!!isEdit}
          companyId={companyId}
          memberId={isEdit ? (params.id as UUID) : null}
          titleKey="form.title.edit"
          onClose={closeOverlays}
          onSubmit={(vals) => handleEdit(vals, params.id as UUID)}
          defaultValues={{
            email: items.find((i) => i.id === params.id)?.email,
            firstName: items.find((i) => i.id === params.id)?.firstName ?? '',
            lastName: items.find((i) => i.id === params.id)?.lastName ?? '',
            phone: items.find((i) => i.id === params.id)?.phone ?? '',
            role: items.find((i) => i.id === params.id)?.role ?? null,
            companyRole: items.find((i) => i.id === params.id)?.companyRole ?? null,
            sendInvite: false,
          }}
          currentCompanyRole={editingMember?.role ?? null}
          lockCompanyRole={false} // volitelný hard-lock z listu; primárně budeme používat stats v Draweru
          lockReasonKey="errors.lastOwner"
        />
      </div>
    </div>
  );
}
