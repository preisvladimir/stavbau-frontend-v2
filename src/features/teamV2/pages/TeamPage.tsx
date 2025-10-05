// src/features/team/pages/TeamPage.tsx
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
import { ROLE_WHITELIST, type CompanyRoleName } from '@/types/common/rbac';
import { formToCreateBody, formToUpdateProfileBody } from '../mappers/TeamMappers';
import type { AnyTeamFormValues } from '../validation/schemas';

import { Button } from '@/components/ui/stavbau-ui/button';
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate';
import { UserPlus, Pencil, Trash2, X, Plus } from '@/components/icons';
import { TEAM_SCOPES } from '../const/scopes';
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { useFab } from '@/components/layout';
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';

// volitelně můžeš nějaké role v UI skrýt (ponech prázdné = zobrazit všechny)
const UI_ROLE_BLACKLIST = new Set<CompanyRoleName>([
   'SUPERADMIN',
]);

// fallback humanizér pro případ, že chybí překladový klíč
const humanizeRole = (r: string) =>
  r
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// užitečný typ pro select options
type RoleOption = { value: '' | CompanyRoleName | string; label: string };

export function useRoleOptions(): RoleOption[] {
  const { t } = useTranslation(['team', 'common']);

  return React.useMemo<RoleOption[]>(() => {
    const allOption: RoleOption = {
      value: '',
      label: t('list.filter.all', { ns: 'team', defaultValue: '— Vše —' }),
    };

    const roleOptions: RoleOption[] = ROLE_WHITELIST
      // pokud chceš něco skrýt v UI:
      .filter((r) => !UI_ROLE_BLACKLIST.has(r as CompanyRoleName))
      // zachová pořadí z whitelistu a nalepí lokalizovaný label
      .map((r) => ({
        value: r,
        label: t(`roles.${r}`, { defaultValue: humanizeRole(String(r)) }),
      }));

    return [allOption, ...roleOptions];
  }, [t]);
}

export default function TeamPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['team', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);
  const companyId = useRequiredCompanyId();

  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { search: locationSearch } = useLocation();

  const [items, setItems] = React.useState<MemberSummaryDto[]>([]);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');
  /** NEW: centralizované filtry (řízené) */
  const [filters, setFilters] = React.useState<{ role?: string }>({ role: '' });

  const isNew = params.id === 'new';
  const isDetail = !!params.id && params.id !== 'new';
  const isEdit = isDetail && new URLSearchParams(locationSearch).get('edit') === '1';

  // List (summary) – doplněn role filtr
  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    const CompanyRole = filters.role && String(filters.role).trim() ? String(filters.role) : undefined;
    console.log(CompanyRole);
    listMemberSummaries(companyId, {
      page,
      size,
      q: search,
      role: CompanyRole, // NEW param (server by měl podporovat; když ne, odfiltruj v FE)
      signal: ac.signal,
    })
      .then((res) => {
        const sorted = [...(res.items ?? [])].sort((a, b) => {
          const an = [a.firstName, a.lastName].filter(Boolean).join(' ') || a.displayName || a.email || '';
          const bn = [b.firstName, b.lastName].filter(Boolean).join(' ') || b.displayName || b.email || '';
          return an.localeCompare(bn);
        });
        setItems(sorted);
        setPage(res.page ?? page);
        setSize(res.size ?? size);
        setTotal(res.total ?? total);
      })
      .catch((e: any) => {
        if (e?.code === 'ERR_CANCELED' || e?.name === 'AbortError') return;
        setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [companyId, page, size, search, filters.role]);

  // Routing helpers
  const moduleBase = '/app/team/';
  const openNew = () => navigate(`${moduleBase}new`);
  const openDetail = (id: UUID) => navigate(`${moduleBase}${id}`);
  const openEdit = (id: UUID) => navigate({ pathname: `${moduleBase}${id}`, search: '?edit=1' });
  const closeOverlays = () => navigate('/app/team');

  const refreshList = React.useCallback(async () => {
    const role = filters.role && String(filters.role).trim() ? String(filters.role) : undefined;
    const res = await listMemberSummaries(companyId, { page, size, q: search, role });
    setItems(res.items ?? []);
  }, [companyId, page, size, search, filters.role]);

  // CREATE
  const handleCreate = async (values: AnyTeamFormValues) => {
    await createMember(companyId, formToCreateBody(values));
    closeOverlays();
    await refreshList();
  };

  // EDIT
  const handleEdit = async (values: AnyTeamFormValues, id: UUID) => {
    const current = items.find((i) => i.id === id);
    const newRole = (values.companyRole ?? values.role) as CompanyRoleName | undefined;
    const prevRole = current?.companyRole ?? current?.role ?? null;

    if (newRole && newRole !== prevRole) {
      await updateMemberRole(companyId, id, { role: newRole });
    }

    const profile = formToUpdateProfileBody(values);
    if (hasProfileChanges(profile)) {
      await updateMemberProfile(companyId, id, profile);
    }

    await refreshList();
    closeOverlays();
  };

  const hasProfileChanges = (obj: Record<string, any>) =>
    Object.values(obj).some((v) => v !== undefined && v !== null && String(v).trim() !== '');

  // DELETE
  const handleDelete = async (id: UUID) => {
    await deleteMember(companyId, id);
    closeOverlays();
    await refreshList();
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
      title={t('list.emptyTitle', { defaultValue: 'Zatím žádní členové' })}
      description={t('list.emptyDesc', { defaultValue: 'Přidejte prvního člena.' })}
      action={
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

  const editingMember = React.useMemo(
    () => (isEdit ? items.find((i) => i.id === params.id) ?? null : null),
    [isEdit, items, params.id]
  );

  // Role options (lokalizované)
  const ROLE_OPTIONS = useRoleOptions(); 

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
        <TeamTable
          data={items}
          loading={loading}
          i18nNamespaces={i18nNamespaces}
          className="mt-2"
          variant="surface"
          search={search}
          onSearchChange={(q) => {
            setSearch(q);
            setPage(0);
          }}
          defaultDensity="cozy"
          pageSizeOptions={[5, 10, 20]}
          page={page}               // 1-based
          pageSize={size}
          total={total}
          onPageChange={setPage}    // dostane 1-based page
          onPageSizeChange={(s) => {
            setSize(s);
            setPage(0);            // pro jistotu i na stránce
          }}
          enableClientPaging={false} // pokud načítáš ze serveru          
          onRowClick={(m) => openDetail(m.id as UUID)}
          rowActions={(m) => (
            <div className="flex items-center gap-2">
              <ScopeGuard anyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.UPDATE]}>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={t('detail.actions.edit', { defaultValue: 'Upravit' }) as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(m.id as UUID);
                  }}
                  title={t('detail.actions.edit', { defaultValue: 'Upravit' }) as string}
                >
                  <Pencil size={16} />
                </Button>
              </ScopeGuard>
              <ScopeGuard anyOf={[TEAM_SCOPES.WRITE, TEAM_SCOPES.REMOVE]}>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label={t('detail.actions.delete', { defaultValue: 'Smazat' }) as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(m.id as UUID);
                  }}
                  title={t('detail.actions.delete', { defaultValue: 'Smazat' }) as string}
                >
                  <Trash2 size={16} />
                </Button>
              </ScopeGuard>
            </div>
          )}
          emptyContent={emptyNode}
          /** NEW: řízené filtry + options pro role */
          filters={filters}
          onFiltersChange={(next) => {
            setFilters(next as { role?: string });
            setPage(0); // reset page při změně filtru
          }}
          roleOptions={ROLE_OPTIONS}
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
          memberId={isDetail ? (params.id as UUID) : null}
          onClose={closeOverlays}
          onEdit={() => openEdit(params.id as UUID)}
          onDelete={(id) => void handleDelete(id)}
          prefill={items.find((i) => i.id === params.id) as any}
        />

        {/* Edit */}
        <TeamFormDrawer
          mode="edit"
          i18nNamespaces={i18nNamespaces}
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
          currentCompanyRole={(editingMember?.role ?? editingMember?.companyRole) ?? null}
          lockCompanyRole={false}
          lockReasonKey="errors.lastOwner"
        />
      </div>
    </div>
  );
}
