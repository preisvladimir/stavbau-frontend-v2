// src/features/customers/components/CustomerDetailDrawer.tsx
import React from 'react';
import { getCustomer }  from '../services/customer.service';
import type { CustomerDto } from "@/lib/api/types";
import { ErrorState } from '@/components/ui/stavbau-ui/errorstate';
import { Loading } from '@/components/ui/stavbau-ui/loading';
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import { RBAC_AREAS } from '@/lib/rbac/areas';

type Props = {
  id: string;
  onClose: () => void;
};

export function CustomerDetailDrawer({ id, onClose }: Props) {
  const [state, setState] = React.useState<{ loading: boolean; data?: CustomerDto; error?: {title?: string; detail?: string} }>({ loading: true });

  React.useEffect(() => {
    let ignore = false;
    setState({ loading: true });
    getCustomer(id)
      .then((data) => !ignore && setState({ loading: false, data }))
      .catch((e) => {
        const detail = e?.response?.data?.detail ?? e.message;
        const title = e?.response?.data?.title ?? 'Error';
        !ignore && setState({ loading: false, error: { title, detail } });
      });
    return () => { ignore = true; };
  }, [id]);

  return (
    <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.WRITE, RBAC_AREAS.CUSTOMERS.READ]}>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <aside className="relative z-10 h-full w-full max-w-xl bg-white dark:bg-neutral-900 shadow-xl p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Detail zákazníka</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
          {state.loading && <Loading />}
          {state.error && <ErrorState title={state.error.title} description={state.error.detail} />}
          {state.data && (
            <section className="space-y-4">
              <div>
                <h3 className="text-base font-medium">{state.data.name}</h3>
                <p className="text-sm text-muted-foreground">{state.data.email ?? '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">IČO:</span> {state.data.ico ?? '—'}</div>
                <div><span className="font-medium">DIČ:</span> {state.data.dic ?? '—'}</div>
                <div className="col-span-2"><span className="font-medium">Telefon:</span> {state.data.phone ?? '—'}</div>
                <div className="col-span-2">
                  <span className="font-medium">Adresa:</span>{' '}
                  {[state.data.addressLine1, state.data.addressLine2, state.data.city, state.data.zip, state.data.country]
                    .filter(Boolean).join(', ') || '—'}
                </div>
                <div className="col-span-2"><span className="font-medium">Poznámka:</span> {state.data.notes ?? '—'}</div>
              </div>
              <div className="text-xs text-muted-foreground">Aktualizováno: {state.data.updatedAt}</div>
            </section>
          )}
        </aside>
      </div>
    </ScopeGuard>
  );
}