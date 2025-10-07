// src/features/customers/pages/CustomersPage.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { CustomersTable } from '../components/CustomersTable';
import { CustomerDetailDrawer } from '../components/CustomerDetailDrawer';
import { CustomerFormDrawer } from '../components/CustomerFormDrawer';

import {
  listCustomerSummaries,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../api/client';
import type { CustomerSummaryDto } from '../api/types';

import { Button } from '@/components/ui/stavbau-ui/button';
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate';
import { Plus, Pencil, Trash2, X } from '@/components/icons';

import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { RBAC_AREAS } from '@/lib/rbac/areas';

import { useFab } from '@/components/layout';
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';

export default function CustomersPage() {
  const { setFab } = useFab();
  const i18nNamespaces = React.useMemo<string[]>(() => ['customers', 'common'], []);
  const { t } = useTranslation(i18nNamespaces);

  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { search: locationSearch } = useLocation();

  const [items, setItems] = React.useState<CustomerSummaryDto[]>([]);
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

    // BE má default sort "name,asc" → nemusíme posílat
    listCustomerSummaries({ page, size, q: search, sort: 'name,asc', signal: ac.signal })
      .then((res) => {
        console.log(res);
        setItems(res.items ?? []);
        setPage(res.page);
        setSize(res.size);
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
  const moduleBase = '/app/customers/';
  const openNew = () => navigate(`${moduleBase}new`);
  const openDetail = (id: string) => navigate(`${moduleBase}${id}`);
  const openEdit = (id: string) => navigate({ pathname: `${moduleBase}${id}`, search: '?edit=1' });
  const closeOverlays = () => navigate('/app/customers');

  const refreshList = React.useCallback(async () => {
    const res = await listCustomerSummaries({ page, size, q: search, sort: 'id,asc' });
    setItems(res.items ?? []);
  }, [page, size, search]);

  // --- CREATE ---
  const handleCreate = async (values: any) => {
    await createCustomer(values);
    closeOverlays();
    await refreshList();
  };

  // --- EDIT ---
  const handleEdit = async (values: any, id: string) => {
    await updateCustomer(id, values);
    await refreshList();
    closeOverlays();
  };

  // --- DELETE ---
  const handleDelete = async (id: string) => {
    await deleteCustomer(id);
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
      title={t('list.emptyTitle', { defaultValue: 'Zatím žádní zákazníci' })}
      description={t('list.emptyDesc', { defaultValue: 'Přidejte prvního zákazníka.' })}
      action={
        <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.CREATE, RBAC_AREAS.CUSTOMERS.WRITE]}>
          <Button leftIcon={<Plus size={16} />} onClick={openNew}>
            {t('list.actions.new', { defaultValue: 'Nový zákazník' })}
          </Button>
        </ScopeGuard>
      }
    />
  );

  // FAB
  React.useEffect(() => {
    setFab({
      label: t('list.actions.new', { defaultValue: 'Nový zákazník' }),
      onClick: () => openNew(),
      icon: <Plus className="h-6 w-6" />,
    });
    return () => setFab(null);
  }, [setFab, t]);

  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        <div className="mb-4 flex items-center justify-between gap-2 md:gap-4">
          <h1 className="text-xl font-semibold">{t('title', { defaultValue: 'Zákazníci' })}</h1>
          <div className="hidden min-w-0 w-full md:w-auto md:flex items-center gap-2 md:gap-3">
            <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.CREATE, RBAC_AREAS.CUSTOMERS.WRITE]}>
              <Button
                type="button"
                variant="primary"
                onClick={openNew}
                disabled={loading}
                ariaLabel={t('actions.newCustomer', { defaultValue: 'Nový zákazník' }) as string}
                leftIcon={<Plus size={16} />}
                className="shrink-0 whitespace-nowrap"
              >
                <span>{t('actions.newCustomer', { defaultValue: 'Nový zákazník' })}</span>
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
        <CustomersTable
          data={items}
          loading={loading}
          i18nNamespaces={i18nNamespaces}
          className="mt-2"
          variant="surface"
          // toolbar (řízená search přes stránku; pokud tabulka nepodporuje, ponechá se ignorováno)
          search={search}
          onSearchChange={(q: string) => {
            setSearch(q);
            setPage(0);
          }}
          defaultDensity="cozy"
          pageSizeOptions={[5, 10, 20]}
          onRowClick={(c) => openDetail(String((c as any).id))}
          rowActions={(c) => (
            <div className="flex items-center gap-2">
              <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.READ]}>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={t('detail.actions.edit') as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(String((c as any).id));
                  }}
                  title={t('detail.actions.edit') as string}
                >
                  <Pencil size={16} />
                </Button>
              </ScopeGuard>
              <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.READ]}>
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label={t('detail.actions.delete') as string}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(String((c as any).id));
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
        <CustomerFormDrawer
          mode="create"
          i18nNamespaces={i18nNamespaces}
          open={isNew}
          titleKey="form.title.create"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleCreate(vals)}
        />

        {/* Detail */}
        {/** Detail si natahuje data sám; posíláme jen prefill, pokud ho máme v listu */}
        <CustomerDetailDrawer
          i18nNamespaces={i18nNamespaces}
          open={isDetail && !isEdit}
          id={isDetail ? (params.id as string) : undefined}
          onClose={closeOverlays}
          onDeleted={() => void refreshList()}
          onEdit={() => openEdit(params.id as string)}
          prefill={items.find((i) => String((i as any).id) === params.id) as any}
        />

        {/* Edit */}
        <CustomerFormDrawer
          mode="edit"
          i18nNamespaces={i18nNamespaces}
          open={!!isEdit}
          id={isEdit ? (params.id as string) : undefined}
          titleKey="form.title.edit"
          onClose={closeOverlays}
          onSubmit={(vals) => void handleEdit(vals, params.id as string)}
          // (volitelné) prefill pro rychlejší UX; form si stejně načte detail
          defaultValues={{
            name: items.find((i) => String((i as any).id) === params.id)?.name ?? '',
            ico: (items.find((i) => String((i as any).id) === params.id) as any)?.ico ?? '',
            dic: (items.find((i) => String((i as any).id) === params.id) as any)?.dic ?? '',
          } as any}
        />
      </div>
    </div>
  );
}
