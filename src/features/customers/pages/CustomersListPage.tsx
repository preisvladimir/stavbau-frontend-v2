// src/features/customers/pages/CustomersListPage.tsx
import React from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { listCustomers } from '../api/client';
import type { CustomerSummaryDto, PageResponse }  from "../api/types";
import { CustomersTable } from '../components/CustomersTable';
import { EmptyState } from "@/components/ui/stavbau-ui/emptystate";
import { ErrorState } from '@/components/ui/stavbau-ui/errorstate';
import { Loading } from '@/components/ui/stavbau-ui/loading';
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import { RBAC_AREAS } from '@/lib/rbac/areas';
import { CustomerDetailDrawer } from '../components/CustomerDetailDrawer';
import { CustomerFormDrawer } from '../components/CustomerFormDrawer';
import { Button } from "@/components/ui/stavbau-ui/button";

export default function CustomersListPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const isCreate = routeId === 'new';
  const isEdit = !!routeId && routeId !== 'new';
  const [editOpen, setEditOpen] = React.useState(false); // ovládá edit form v režimu :id

  const [state, setState] = React.useState<{
    data?: PageResponse<CustomerSummaryDto>;
    loading: boolean;
    error?: { title?: string; detail?: string };
  }>({ loading: true });

  const q = sp.get('q') ?? '';
  const page = Number(sp.get('page') ?? 0);
  const size = Number(sp.get('size') ?? 20);
  const debouncedQ = useDebounce(q, 350);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let ignore = false;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    listCustomers({ q: debouncedQ || undefined, page, size })
      .then((data) => !ignore && setState({ loading: false, data }))
      .catch((e: any) => {
        const detail = e?.response?.data?.detail ?? e.message;
        const title = e?.response?.data?.title ?? 'Error';
        !ignore && setState({ loading: false, error: { title, detail } });
      });
    return () => {
      ignore = true;
    };
  }, [debouncedQ, page, size, reloadKey]);

  const onSearch = (val: string) => {
    const next = new URLSearchParams(sp);
    next.set('q', val);
    next.set('page', '0'); // reset stránky při změně filtru
    setSp(next, { replace: true });
  };

  const onPageChange = (nextPage: number) => {
    const next = new URLSearchParams(sp);
    next.set('page', String(nextPage));
    setSp(next, { replace: true });
  };

  // Pokud je načítání a zároveň nevykreslujeme žádný drawer, ukaž spinner.
  if (state.loading && !isCreate && !isEdit) {
    return <Loading />;
  }
  if (state.error && !isCreate && !isEdit) {
    return <ErrorState title={state.error.title} description={state.error.detail} />;
  }

  const items = state.data?.items ?? [];
  const total = state.data?.total ?? 0;
  const atFirstPage = page <= 0;
  const atLastPage = (page + 1) * size >= total;

  return (
    <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.WRITE, RBAC_AREAS.CUSTOMERS.READ]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <input
            className="input input-bordered w-full max-w-md"
            placeholder="Hledat zákazníka…"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
          />
          <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.WRITE, RBAC_AREAS.CUSTOMERS.CREATE]}>
            <Button onClick={() => navigate('/app/customers/new')}>+ Nový</Button>
          </ScopeGuard>
        </div>

        {/* Pokud je loading/error ale máme otevřený drawer (create/edit), necháme obsah listu klidně prázdný */}
        {items.length === 0 && !state.loading && !state.error ? (
          <EmptyState title="Žádní zákazníci" description="Zkuste upravit vyhledávání." />
        ) : items.length > 0 ? (
          <>
            <CustomersTable data={items} onRowClick={(id) => navigate(`/app/customers/${id}`)} />
            {/* jednoduché stránkování (MVP) */}
            <div className="flex justify-end items-center gap-2 pt-2">
              <button className="btn btn-sm" disabled={atFirstPage} onClick={() => onPageChange(page - 1)}>
                ←
              </button>
              <span className="text-sm">{page + 1}</span>
              <button className="btn btn-sm" disabled={atLastPage} onClick={() => onPageChange(page + 1)}>
                →
              </button>
            </div>
          </>
        ) : null}

        {/* Drawery musí být mimo podmínku na items.length, aby fungovaly i na prázdném listu */}
        {isEdit && routeId && !editOpen && (
          <CustomerDetailDrawer
            id={routeId}
            onClose={() => navigate('/app/customers', { replace: true })}
            onDeleted={() => setReloadKey((k) => k + 1)}
            onEdit={() => setEditOpen(true)}
          />
        )}
        {(isCreate || (isEdit && editOpen)) && (
          <CustomerFormDrawer
            id={isEdit ? routeId : undefined}
            onClose={() => {
              setEditOpen(false);
              navigate(isEdit ? `/app/customers/${routeId}` : '/app/customers', { replace: true });
            }}
          />
        )}
      </div>
    </ScopeGuard>
  );
}
