// src/features/customers/pages/CustomersListPage.tsx
import React from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useDebounce } from '@/lib/utils/useDebounce';
import { listCustomers } from '../services/customer.service';
import type { CustomerSummaryDto, PageResponse } from "@/lib/api/types";
import { CustomersTable } from '../components/CustomersTable';
import { EmptyState } from "@/components/ui/stavbau-ui/emptystate";
import { ErrorState } from '@/components/ui/stavbau-ui/errorstate';
import { Loading } from '@/components/ui/stavbau-ui/loading';
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import { RBAC_AREAS } from '@/lib/rbac/areas';
import { CustomerDetailDrawer } from '../components/CustomerDetailDrawer';

export default function CustomersListPage() {
    const [sp, setSp] = useSearchParams();
    const navigate = useNavigate();
    const { id: routeId } = useParams();
    const [state, setState] = React.useState<{
        data?: PageResponse<CustomerSummaryDto>;
        loading: boolean;
        error?: { title?: string; detail?: string };
    }>({ loading: true });

    const q = sp.get('q') ?? '';
    const page = Number(sp.get('page') ?? 0);
    const size = Number(sp.get('size') ?? 20);
    const debouncedQ = useDebounce(q, 350);

    React.useEffect(() => {
        let ignore = false;
        setState((s) => ({ ...s, loading: true, error: undefined }));
        listCustomers({ q: debouncedQ || undefined, page, size })
            .then((data) => !ignore && setState({ loading: false, data }))
            .catch((e) => {
                const detail = e?.response?.data?.detail ?? e.message;
                const title = e?.response?.data?.title ?? 'Error';
                !ignore && setState({ loading: false, error: { title, detail } });
            });
        return () => {
            ignore = true;
        };
    }, [debouncedQ, page, size]);

    const onSearch = (val: string) => {
        sp.set('q', val);
        sp.set('page', '0'); // reset stránky při změně filtru
        setSp(sp, { replace: true });
    };

    const onPageChange = (nextPage: number) => {
        sp.set('page', String(nextPage));
        setSp(sp, { replace: true });
    };

    if (state.loading) return <Loading />;
    if (state.error) return <ErrorState title={state.error.title} description={state.error.detail} />;
    const items = state.data?.items ?? [];

    return (
        <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.WRITE, RBAC_AREAS.CUSTOMERS.READ]}>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <input
                        className="input input-bordered w-full max-w-md"
                        placeholder="Hledat zákazníka…"
                        defaultValue={q}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
                {items.length === 0 ? (
                    <EmptyState
                        title="Žádní zákazníci"
                        description="Zkuste upravit vyhledávání."
                    />
                ) : (
                    <>
                        <CustomersTable
                            data={items}
                            onRowClick={(id) => navigate(`/app/customers/${id}`)}
                        />
                        {/* jednoduché stránkování (MVP) */}
                        <div className="flex justify-end items-center gap-2 pt-2">
                            <button
                                className="btn btn-sm"
                                disabled={page <= 0}
                                onClick={() => onPageChange(page - 1)}
                            >
                                ←
                            </button>
                            <span className="text-sm">{page + 1}</span>
                            <button
                                className="btn btn-sm"
                                disabled={(state.data?.items.length ?? 0) < size}
                                onClick={() => onPageChange(page + 1)}
                            >
                                →
                            </button>
                        </div>
                        {routeId && (
                            <CustomerDetailDrawer
                                id={routeId}
                                onClose={() => navigate('/app/customers', { replace: true })}
                            />
                        )}
                    </>
                )}
            </div>
        </ScopeGuard>
    );
}