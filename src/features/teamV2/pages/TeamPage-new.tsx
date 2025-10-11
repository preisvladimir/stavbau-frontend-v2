// src/features/team/pages/TeamPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useOverlayRouting } from '@/lib/router/useOverlayRouting';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';

import { TeamTable } from '../components/TeamTable';
import { TeamDetailDrawer } from '../components/TeamDetailDrawer';
import { TeamFormDrawer } from '../components/TeamFormDrawer';

import { formToCreateBody, formToUpdateProfileBody } from '../mappers/TeamMappers';
import type { AnyTeamFormValues } from '../validation/schemas';

import { useServerTableState } from '@/lib/hooks/useServerTableState';

import { Button } from '@/components/ui/stavbau-ui/button';
import { SmartEmptyState } from '@/components/ui/stavbau-ui/emptystate/SmartEmptyState';
import { UserPlus, Plus } from '@/components/icons';
import { TEAM_SCOPES } from '../const/scopes';
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { useFab } from '@/components/layout';
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';
import { useRoleOptions } from '@/features/rbac/hooks/useRoleOptions';

import { teamService } from '@/features/teamV2/api/team-service';
import type { MemberSummaryDto, UUID, CompanyRoleName } from '../api/types';
import type { TeamFilters } from '@/features/teamV2/api/team-service';
import LoadErrorStatus from '@/components/ui/stavbau-ui/feedback/LoadErrorStatus';
import RowActions from '@/components/ui/stavbau-ui/datatable/RowActions';
import { ServerTableEmpty } from '@/components/ui/stavbau-ui/emptystate/ServerTableEmpty';



export default function TeamPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['team', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);

  const companyId = useRequiredCompanyId();
  const team = React.useMemo(() => teamService(companyId), [companyId]);

  // Role options (lokalizované)
  const roleOptions = useRoleOptions({ exclude: ['SUPERADMIN'], withAll: false });

  // const [error, setError] = React.useState<string | null>(null);
  /** Řízené UI filtry (role) – napojujeme do fetcheru přes closure */
  //const [filters, setFilters] = React.useState<{ role?: string }>({ role: '' });


  // ---------------------------------------------------------------------------
  // Server-side řízení tabulky (unifikovaný hook jako u Projects)
  // - fetcher stabilizovaný přes useCallback (závisí na companyId + role)
  // - default sort na existující sloupec `email` (BE allowlist)
  // ---------------------------------------------------------------------------

  const fetcher = React.useCallback(
    ({ q, page, size, sort, filters }: {
      q?: string;
      page?: number;
      size?: number;
      sort?: string | string[];
      filters?: TeamFilters;
    }) =>
      team.list({
        q,
        page,
        size,
        sort,
        filters, // wrapper si sám převede role/status přes filtersToQuery
      }),
    [team]
  );

  const {
    data, loading, error, clearError,
    q, sort, size, filters, page1, total, //* page *//
    onSearchChange, onSortChange, onPageChange, onPageSizeChange,
    onFiltersChange, //updateFilters,
    refreshList, refreshAfterMutation,
  } = useServerTableState<MemberSummaryDto, TeamFilters>({
    fetcher,
    defaults: { q: '', page: 0, size: 10, sort: [{ id: 'lastName', desc: false }], filters: { role: '', status: '' } },
    // volitelně: centralizovaný handler (toast/telemetrie); lze ponechat prázdné
    onError: (e) => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[TeamPage] load error', e);
      }
    },
  });


  const {
    id: routeId, isNew, isDetail, isEdit, //moduleBase,
    openNew, openDetail, openEdit, closeOverlays,
  } = useOverlayRouting({ module: 'team' });




  // CREATE
  const handleCreate = async (values: AnyTeamFormValues) => {
    await team.create(formToCreateBody(values));
    closeOverlays();
    await refreshAfterMutation(); // po create skoč na 1. stránku
  };

  // EDIT
  const editingMember = React.useMemo(
    () => (isEdit ? data.items.find((i) => i.id === routeId) ?? null : null),
    [isEdit, data.items, routeId]
  );

  const handleEdit = React.useCallback(async (values: AnyTeamFormValues, id: UUID) => {
    const prevRole = editingMember?.companyRole ?? editingMember?.role ?? undefined;
    const newRole = (values.companyRole ?? values.role) as CompanyRoleName | undefined;

    const profile = formToUpdateProfileBody(values);
    const profileChanged = hasProfileChanges(profile);

    if (newRole && newRole !== prevRole) {
      await team.updateRole(id, { role: newRole });
    }
    if (profileChanged) {
      await team.updateProfile(id, profile);
    }
    if (!profileChanged && (!newRole || newRole === prevRole)) {
      // nic se nemění → jen zavřít
      closeOverlays();
      return;
    }

    await refreshList();
    closeOverlays();
  }, [team, editingMember, refreshList, closeOverlays]);

  const hasProfileChanges = (obj: Record<string, unknown>) =>
    Object.values(obj).some(
      (v) => v !== undefined && v !== null && (typeof v !== 'string' || v.trim() !== '')
    );

  // DELETE (hard delete přes service.remove – ten volá DELETE /{id})
  const handleDelete = async (id: UUID) => {
    await team.remove(id);
    closeOverlays();
    await refreshList();
  };

  const emptyNode = (
    <SmartEmptyState
      hasSearch={!!q}
      i18nNamespaces={i18nNamespaces}
      // texty pro search stav
      searchTitleKey="list.emptyTitle"
      searchDescKey="list.emptyDesc"
      clearLabelKey="list.actions.open"
      onClearSearch={() => onSearchChange('')}
      // texty + akce pro „zatím žádní členové“
      emptyTitleKey="list.emptyTitle"
      emptyDescKey="list.emptyDesc"
      emptyAction={
        <ScopeGuard anyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.ADD]}>
          <Button leftIcon={<UserPlus size={16} />} onClick={openNew}>
            {t('list.actions.add', { defaultValue: 'Přidat člena' })}
          </Button>
        </ScopeGuard>
      }
    />
  );



  // FAB
  React.useEffect(() => {
    setFab({
      label: t('list.actions.add', { defaultValue: 'Přidat člena' }),
      onClick: () => openNew(),
      icon: <Plus className="h-6 w-6" />,
    });
    return () => setFab(null);
  }, [setFab, t]);


  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        <div className="mb-4 flex items-center justify-between gap-2 md:gap-4">
          <h1 className="text-xl font-semibold">{t('title', { defaultValue: 'Tým' })}</h1>
          <div className="hidden min-w-0 w-full md:w-auto md:flex items-center gap-2 md:gap-3">
            <ScopeGuard anyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.ADD]}>
              <Button
                type="button"
                variant="primary"
                onClick={openNew}
                disabled={loading}
                ariaLabel={t('actions.newUser', { defaultValue: 'Nový člen' }) as string}
                leftIcon={<UserPlus size={16} />}
                className="shrink-0 whitespace-nowrap"
              >
                <span>{t('actions.newUser', { defaultValue: 'Nový člen' })}</span>
              </Button>
            </ScopeGuard>
          </div>
        </div>

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
        <TeamTable
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
          rowActions={(m) => (
            <RowActions
              item={m}
              asMenu // nebo 'auto' | false
              maxInline={2}
              compact={true}
              i18nNamespaces={i18nNamespaces}
              menuLabel={t('list.actions.title', { defaultValue: 'Akce' })}
              actions={[
                { kind: 'detail', onClick: () => openDetail(m.id as UUID), scopesAnyOf: [TEAM_SCOPES.READ] },
                { kind: 'edit', onClick: () => openEdit(m.id as UUID), scopesAnyOf: [TEAM_SCOPES.UPDATE] },
                //{ kind: 'archive', onClick: async () => {/* await team.archive(m.id as UUID) */ }, scopesAnyOf: [TEAM_SCOPES.ARCHIVE], confirm: {} },
                 { kind: 'delete', onClick: () => handleDelete(m.id as UUID), scopesAnyOf: [TEAM_SCOPES.REMOVE], confirm: {} },
              ]}
            />
          )}
          emptyContent={emptyNode}
          // Create skrze FAB / primární CTA nahoře
          canCreate={false}
          onOpenCreate={undefined}
          /** NEW: řízené filtry + options pro role */
          filters={filters}
          onFiltersChange={(next) => onFiltersChange(next)}

          roleOptions={roleOptions}
        />

        {/* Create */}
        <TeamFormDrawer
          mode="create"
          i18nNamespaces={i18nNamespaces}
          open={isNew}
          companyId={companyId}
          titleKey="form.title.create"
          onClose={closeOverlays}
          onSubmit={handleCreate}
        />

        {/* Detail */}
        <TeamDetailDrawer
          i18nNamespaces={i18nNamespaces}
          open={isDetail && !isEdit}
          companyId={companyId}
          memberId={isDetail ? (routeId as UUID) : null}
          onClose={closeOverlays}
          onEdit={() => openEdit(routeId as UUID)}
          onDelete={(id) => void handleDelete(id)}
          prefill={data.items.find((i) => i.id === routeId) as any}
        />

        {/* Edit */}
        <TeamFormDrawer
          mode="edit"
          i18nNamespaces={i18nNamespaces}
          open={!!isEdit}
          companyId={companyId}
          memberId={isEdit ? (routeId as UUID) : null}
          titleKey="form.title.edit"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleEdit(vals, routeId as UUID)}
          defaultValues={{
            email: editingMember?.email,
            firstName: editingMember?.firstName ?? '',
            lastName: editingMember?.lastName ?? '',
            phone: editingMember?.phone ?? '',
            role: editingMember?.role ?? null,
            companyRole: editingMember?.companyRole ?? null,
            sendInvite: false,
          }}
          currentCompanyRole={editingMember?.role ?? editingMember?.companyRole ?? null}
          lockCompanyRole={false}
          lockReasonKey="errors.lastOwner"
        />
      </div>
    </div>
  );
}
