// src/features/team/pages/TeamPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';

// --- App hooks & routing ---
import { useOverlayRouting } from '@/lib/router/useOverlayRouting';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';
import { useServerTableState } from '@/lib/hooks/useServerTableState';
import { useFab } from '@/components/layout';

// --- RBAC / guards ---
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { TEAM_SCOPES } from '../const/scopes';
import { useRoleOptions } from '@/features/rbac/hooks/useRoleOptions';

// --- API / types ---
import { teamService } from '@/features/teamV2/api/team-service';
import type { TeamFilters } from '@/features/teamV2/api/team-service';
import type { MemberSummaryDto, UUID, CompanyRoleName } from '../api/types';

// --- Mappers & validation ---
import { formToCreateBody, formToUpdateProfileBody } from '../mappers/TeamMappers';
import type { AnyTeamFormValues } from '../validation/schemas';

// --- UI components ---
import { StbEntityTable } from '@/components/ui/stavbau-ui/datatable/StbEntityTable';
import { CrudDrawer } from '@/components/ui/stavbau-ui/drawer/crud-drawer';
import type { DataTableV2Column } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';
import { Detail as TeamDetail } from '../components/Detail';
import { Form as TeamForm } from '../components/Form';
import { TableHeader } from '@/components/ui/stavbau-ui/datatable/TableHeader';
import RowActions from '@/components/ui/stavbau-ui/datatable/RowActions';
import { ServerTableEmpty } from '@/components/ui/stavbau-ui/emptystate/ServerTableEmpty';
import LoadErrorStatus from '@/components/ui/stavbau-ui/feedback/LoadErrorStatus';
import { Button } from '@/components/ui/stavbau-ui/button';

// --- UI utils & tokens ---
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';
import { Mail, Shield, User as UserIcon } from '@/components/icons';
import { UserPlus, Plus } from '@/components/icons';

export default function TeamPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['team', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);

  const companyId = useRequiredCompanyId();
  const team = React.useMemo(() => teamService(companyId), [companyId]);

  // Lokalizované role do filtru tabulky
  const roleOptions = useRoleOptions({ exclude: ['SUPERADMIN'], withAll: false });

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
    data,
    loading,
    error,
    clearError,
    q,
    sort,
    size,
    filters,
    page1,
    total,
    onSearchChange,
    onSortChange,
    onPageChange,
    onPageSizeChange,
    onFiltersChange,
    refreshList,
    refreshAfterMutation,
  } = useServerTableState<MemberSummaryDto, TeamFilters>({
    fetcher,
    defaults: {
      q: '',
      page: 0, // interně 0-based, hook vystavuje i page1 (1-based) pro UI
      size: 10,
      sort: [{ id: 'lastName', desc: false }],
      filters: { role: '', status: '' },
    },
    onError: (e) => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[TeamPage] load error', e);
      }
    },
  });

  const { id: routeId, isNew, isDetail, isEdit, openNew, openDetail, openEdit, closeOverlays } =
    useOverlayRouting({ module: 'team' });

  // --- helpers ---
  const hasProfileChanges = (obj: Record<string, unknown>) =>
    Object.values(obj).some(
      (v) => v !== undefined && v !== null && (typeof v !== 'string' || v.trim() !== '')
    );

  // --- CREATE ---
  const handleCreate = React.useCallback(
    async (values: AnyTeamFormValues) => {
      await team.create(formToCreateBody(values));
      closeOverlays();
      await refreshAfterMutation(); // po create skoč na 1. stránku
    },
    [team, closeOverlays, refreshAfterMutation]
  );

  // --- EDIT ---
  const editingMember = React.useMemo(
    () => (isEdit ? data.items.find((i) => i.id === routeId) ?? null : null),
    [isEdit, data.items, routeId]
  );

  const handleEdit = React.useCallback(
    async (values: AnyTeamFormValues, id: UUID) => {
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
    },
    [team, editingMember, refreshList, closeOverlays]
  );

  // --- DELETE (hard delete) ---
  const handleDelete = React.useCallback(
    async (id: UUID) => {
      await team.remove(id);
      closeOverlays();
      await refreshList();
    },
    [team, closeOverlays, refreshList]
  );

  // --- Empty state node ---
  const emptyNode = (
    <ServerTableEmpty
      q={q}
      i18nNamespaces={i18nNamespaces}
      onClearSearch={() => onSearchChange('')}
      requiredScopesAnyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.ADD]}
      emptyAction={
        <Button leftIcon={<UserPlus size={16} />} onClick={openNew}>
          {t('list.actions.add', { defaultValue: 'Přidat člena' })}
        </Button>
      }
    />
  );

  // --- FAB ---
  React.useEffect(() => {
    setFab({
      label: t('list.actions.add', { defaultValue: 'Přidat člena' }),
      onClick: () => openNew(),
      icon: <Plus className="h-6 w-6" />,
    });
    return () => setFab(null);
  }, [setFab, t, openNew]);

  // ---------------------------------------------------------------------------
  // Sloupce tabulky (původně v TeamTable) – nyní lokálně pro StbEntityTable
  // ---------------------------------------------------------------------------
  const columns = React.useMemo<DataTableV2Column<MemberSummaryDto>[]>(() => [
    {
      id: 'avatar',
      header: '',
      accessor: (_m) => '',
      cell: () => (
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <UserIcon size={16} />
        </div>
      ),
      enableSorting: false,
      meta: { stbMobile: { priority: 99, mobileHidden: true } },
    },
    // lastName (sort klíč) + firstName vedle
    {
      id: 'lastName',
      header: t('list.columns.lastname'),
      accessor: (m) => m.lastName ?? '—',
      cell: (m) => (
        <span className="block xl:max-w-[260px] xl:truncate">{m.lastName ?? '—'}</span>
      ),
      meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
    },
    {
      id: 'firstName',
      header: t('list.columns.firstname'),
      accessor: (m) => m.firstName ?? '—',
      cell: (m) => (
        <span className="block xl:max-w-[260px] xl:truncate">{m.firstName ?? '—'}</span>
      ),
      meta: { stbMobile: { isTitle: true, priority: 0, label: t('list.columns.name') } },
    },
    // email (aliased allowlist klíč 'user.email')
    {
      id: 'user.email',
      header: t('list.columns.email'),
      accessor: (m) => m.email ?? '—',
      cell: (m) => (
        <span className="inline-flex items-center gap-1 xl:max-w-[320px] xl:truncate">
          <Mail size={14} />
          <span className="truncate">{m.email ?? '—'}</span>
        </span>
      ),
      meta: { stbMobile: { isSubtitle: true, priority: 1, label: t('list.columns.email') } },
    },
    // role (bez řazení)
    {
      id: 'role',
      header: t('list.columns.companyRole'),
      accessor: (m) => m.role ?? m.companyRole ?? '—',
      cell: (m) => (
        <span className="inline-flex items-center gap-1">
          <Shield size={14} />{' '}
          {t(`roles.${m.role ?? m.companyRole}`, {
            defaultValue: m.role ?? m.companyRole ?? '—',
          })}
        </span>
      ),
      enableSorting: false,
      meta: { stbMobile: { priority: 2, label: t('list.columns.companyRole') } },
    },
  ], [t]);

  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        {/* Table Header */}
        <TableHeader
          title={t('title', { defaultValue: 'Tým' })}
          subtitle={t('subtitle', { defaultValue: 'Správa členů a rolí' })}
          actions={
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
          }
        />

        {/* Status */}
        <LoadErrorStatus
          loading={loading}
          error={error}
          onClear={clearError}
          i18nNamespaces={i18nNamespaces}
        />

        {/* TABLE – StbEntityTable (1-based page) */}
        <StbEntityTable<MemberSummaryDto>
          // i18n / vzhled
          i18nNamespaces={i18nNamespaces}
          className="mt-2"
          variant="surface"
          defaultDensity="cozy"
          pageSizeOptions={[5, 10, 20]}

          // data & řízení (server-side; 1-based)
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
          keyField={(m) => String(m.id)}

          // interakce s řádky
          onRowClick={(m) => openDetail(m.id as UUID)}
          rowActions={(m) => (
            <RowActions
              item={m}
              asMenu
              maxInline={2}
              compact
              i18nNamespaces={i18nNamespaces}
              menuLabel={t('list.actions.title', { defaultValue: 'Akce' })}
              actions={[
                { kind: 'detail', onClick: () => openDetail(m.id as UUID), scopesAnyOf: [TEAM_SCOPES.READ] },
                { kind: 'edit', onClick: () => openEdit(m.id as UUID), scopesAnyOf: [TEAM_SCOPES.UPDATE] },
                // { kind: 'archive', onClick: async () => {/* await team.archive(m.id as UUID) */}, scopesAnyOf: [TEAM_SCOPES.ARCHIVE], confirm: {} },
                { kind: 'delete', onClick: () => handleDelete(m.id as UUID), scopesAnyOf: [TEAM_SCOPES.REMOVE], confirm: {} },
              ]}
            />
          )}

          // řízené filtry + options pro role (toolbar)
          filters={filters}
          onFiltersChange={onFiltersChange}
          roleOptions={roleOptions}

          // prázdný stav
          emptyContent={emptyNode}
        />

        <CrudDrawer<MemberSummaryDto, AnyTeamFormValues>
          // režimy (z useOverlayRouting)
          isDetail={isDetail && !isEdit}
          isNew={isNew}
          isEdit={!!isEdit}
          entityId={isDetail || isEdit ? (routeId as UUID) : null}
          onClose={closeOverlays}

          // UI
          titles={{
            detail: t('detail.title', { defaultValue: 'Detail člena' }),
            create: t('form.title.create', { defaultValue: 'Nový člen' }),
            edit: t('form.title.edit', { defaultValue: 'Upravit člena' }),
          }}

          // data & prefill
          listItems={data.items}
          fetchDetail={(id, opts) => team.get(id as any, opts)}   // stejný vzor jako dnes
          mapDetailToFormDefaults={(m) => ({
            email: m.email,
            firstName: m.firstName ?? '',
            lastName: m.lastName ?? '',
            phone: m.phone ?? '',
            role: (m as any).role ?? (m as any).companyRole ?? null,
            companyRole: (m as any).companyRole ?? (m as any).role ?? null,
            sendInvite: false,
          })}

          // DETAIL (slot)
          renderDetail={({ id, data, loading, error, onDelete }) => (
            <TeamDetail
              i18nNamespaces={i18nNamespaces}
              open
              prefill={undefined}             // už není třeba – data přichází z orchestrátoru
              data={data as any}
              loading={loading}
              error={error ?? null}
              onClose={closeOverlays}
              onEdit={() => openEdit(routeId as UUID)}
              onDelete={(x) => void onDelete?.(String(x))}
            />
          )}

          // CREATE (slot)
          renderCreateForm={({ defaultValues, submitting, onSubmit, onCancel }) => (
            <TeamForm
              mode="create"
              i18nNamespaces={i18nNamespaces}
              defaultValues={defaultValues}
              submitting={submitting}
              onSubmit={onSubmit}
              onCancel={onCancel}
              resetAfterSubmit
            />
          )}

          // EDIT (slot) + last OWNER guard může zůstat ve formu (TeamFormDrawer pattern)
          renderEditForm={({ defaultValues, submitting, onSubmit, onCancel }) => (
            <TeamForm
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
          beforeEditSubmit={(vals, { id }) => { /* volitelně extra guard */ }}
          onEdit={async (vals, id) => { await handleEdit(vals, id as UUID); }}
          onDelete={async (id) => { await handleDelete(id as UUID); }}
          afterMutate={refreshList}
        />
      </div>
    </div>
  );
}
