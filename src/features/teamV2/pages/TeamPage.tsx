// src/features/team/pages/TeamPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';

// --- App hooks & routing ---
import { useOverlayRouting } from '@/lib/router/useOverlayRouting';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';
import { useServerTableState } from '@/lib/hooks/useServerTableState';
import { useFab } from '@/components/layout';

// --- API / types ---
import { teamService } from '@/features/teamV2/api/team-service';
import type { TeamFilters } from '@/features/teamV2/api/team-service';
import type { MemberSummaryDto, CompanyRoleName } from '../api/types';

// --- Mappers & validation ---
import { formToCreateBody, formToUpdateProfileBody } from '../mappers/TeamMappers';
import type { AnyTeamFormValues } from '../validation/schemas';


// --- UUID - only one ---
import type { UUID } from '@/types';
// --- RBAC / guards ---
import { ScopeGuard, sc, useRoleOptions } from '@/rbac';
// --- UI components ---
import {
  sbContainer,
  InlineStatus,// --- Globální feedback (toast/inline rozhodování) ---
  useFeedback, // --- Globální feedback (toast/inline rozhodování) ---
  Button,      // --- UI component Button ---
  CrudDrawer,
  StbEntityTable,
  type DataTableV2Column,
  RowActions,
  TableHeader,
  ServerTableEmpty
} from '@/ui';


import { Detail as TeamDetail } from '../components/Detail';
import { Form as TeamForm } from '../components/Form';

// --- UI utils & tokens ---
import { cn } from '@/lib/utils/cn';

import { Mail, Shield, User as UserIcon, UserPlus, Plus } from '@/components/icons';




export default function TeamPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['team', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);

  const companyId = useRequiredCompanyId();
  const team = React.useMemo(() => teamService(companyId), [companyId]);

  // Jedna scope pro stránku (list)
  const feedback = useFeedback();
  const scope = 'team.list';

  // Lokalizované role do filtru tabulky
  const roleOptions = useRoleOptions({ exclude: ['SUPERADMIN'], withAll: false });

  // ---------------------------------------------------------------------------
  // Server-side řízení tabulky
  // ---------------------------------------------------------------------------
  const fetcher = React.useCallback(
    ({ q, page, size, sort, filters }: { q?: string; page?: number; size?: number; sort?: string | string[]; filters?: TeamFilters; }) =>
      team.list({ q, page, size, sort, filters }),
    [team]
  );

  const {
    data,
    loading,
    //error,
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
      feedback.showError(e, { scope, title: t('errors.loadFailed', { defaultValue: 'Načtení selhalo' }) });
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
      feedback.show({
        severity: 'success',
        title: t('toasts.created.title', { defaultValue: 'Člen přidán' }),
        scope,
      });
    },
    [team, closeOverlays, refreshAfterMutation, feedback, scope, t]
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
        closeOverlays();
        return;
      }

      await refreshList();
      closeOverlays();
      feedback.show({
        severity: 'success',
        title: t('toasts.updated.title', { defaultValue: 'Uloženo' }),
        scope,
      });
    },
    [team, editingMember, refreshList, closeOverlays, feedback, scope, t]
  );

  // --- DELETE (hard delete) ---
  const handleDelete = React.useCallback(
    async (id: UUID) => {
      try {
        await team.remove(id);
        await refreshList();
        feedback.show({
          severity: 'success',
          title: t('toasts.deleted.title', { defaultValue: 'Smazáno' }),
          scope,
        });
      } catch (e) {
        // 403 řeší globální guard – showError jej sama tiše ignoruje
        feedback.showError(e, {
          scope,
          title: t('errors.deleteFailed', { defaultValue: 'Nelze smazat' }),
        });
        throw e;
      }
    },
    [team, refreshList, feedback, scope, t]
  );

  // --- Empty state node ---
  const emptyNode = (
    <ServerTableEmpty
      q={q}
      i18nNamespaces={i18nNamespaces}
      onClearSearch={() => onSearchChange('')}
      requiredScopesAnyOf={[sc.team.write, sc.team.add]}
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
  // Sloupce tabulky
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
        {/* Header */}
        <TableHeader
          title={t('title', { defaultValue: 'Tým' })}
          subtitle={t('subtitle', { defaultValue: 'Správa členů a rolí' })}
          actions={
            <ScopeGuard anyOf={[sc.team.write, sc.team.add]}>
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

        {/* Globální inline status pro tuto stránku */}
        <InlineStatus scope={scope} onClear={clearError} />

        {/* Tabulka */}
        <StbEntityTable<MemberSummaryDto>
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
          keyField={(m) => String(m.id)}
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
                { kind: 'detail', onClick: () => openDetail(m.id as UUID), scopesAnyOf: [sc.team.read] },
                { kind: 'edit', onClick: () => openEdit(m.id as UUID), scopesAnyOf: [sc.team.update] },
                {
                  kind: 'delete',
                  onClick: () => handleDelete(m.id as UUID),
                  scopesAnyOf: [sc.team.remove],
                  confirm: {
                    title: t('list.confirm.delete.title', { defaultValue: 'Smazat člena?' }),
                    description: t('list.confirm.delete.desc', { defaultValue: 'Tato akce je nevratná.' }),
                    confirmLabel: t('common:delete', { defaultValue: 'Smazat' }),
                    cancelLabel: t('common:cancel', { defaultValue: 'Zrušit' }),
                  },
                },
              ]}
            />
          )}
          filters={filters}
          onFiltersChange={onFiltersChange}
          roleOptions={roleOptions}
          emptyContent={emptyNode}
        />

        {/* Orchestrátor Drawer */}
        <CrudDrawer<MemberSummaryDto, AnyTeamFormValues>
          isDetail={isDetail && !isEdit}
          isNew={isNew}
          isEdit={!!isEdit}
          entityId={isDetail || isEdit ? (routeId as UUID) : null}
          onClose={closeOverlays}
          titles={{
            detail: t('detail.title', { defaultValue: 'Detail člena' }),
            create: t('form.title.create', { defaultValue: 'Nový člen' }),
            edit: t('form.title.edit', { defaultValue: 'Upravit člena' }),
          }}
          listItems={data.items}
          fetchDetail={(id, opts) => team.get(id as any, opts)}
          mapDetailToFormDefaults={(m) => ({
            email: m.email,
            firstName: m.firstName ?? '',
            lastName: m.lastName ?? '',
            phone: (m as any).phone ?? '',
            role: (m as any).role ?? (m as any).companyRole ?? null,
            companyRole: (m as any).companyRole ?? (m as any).role ?? null,
            sendInvite: false,
          })}
          renderDetail={({ data, loading, error, onDelete }) => (
            <TeamDetail
              i18nNamespaces={i18nNamespaces}
              open
              data={data as any}
              loading={loading}
              error={error ?? null}
              onClose={closeOverlays}
              onEdit={() => openEdit(routeId as UUID)}
              onDelete={(x) => void onDelete?.(String(x))}
            />
          )}
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
          onCreate={async (vals) => { await handleCreate(vals); }}
          onEdit={async (vals, id) => { await handleEdit(vals, id as UUID); }}
          onDelete={async (id) => { await handleDelete(id as UUID); }}
          afterMutate={refreshList}
        />
      </div>
    </div>
  );
}
