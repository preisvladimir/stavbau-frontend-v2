// src/features/customers/components/CustomerDetailDrawer.tsx
import React from 'react';
import { getCustomer, deleteCustomer } from '../api/client';
import type { CustomerDto } from "../api/types";
import type { AddressDto } from '@/types/common/address';
import { ErrorState } from '@/components/ui/stavbau-ui/errorstate';
import { Loading } from '@/components/ui/stavbau-ui/loading';
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import { RBAC_AREAS } from '@/lib/rbac/areas';
import { ConfirmModal } from '@/components/ui/stavbau-ui/modal/confirm-modal';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';

type Props = {
  id: string;
  onClose: () => void;
  onDeleted?: () => void;
  onEdit?: () => void;
};

export function CustomerDetailDrawer({ id, onClose, onDeleted, onEdit }: Props) {
  const [state, setState] = React.useState<{ loading: boolean; data?: CustomerDto; error?: { title?: string; detail?: string } }>({ loading: true });
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

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

  // ---- adresa pro zobrazení v detailu (typed billingAddress) ----
  const formatAddress = (a?: AddressDto): string | undefined => {
    if (!a) return undefined;
    const formatted = a.formatted?.trim();
    if (formatted) return formatted;
    const line1 = [a.street, [a.houseNumber, a.orientationNumber].filter(Boolean).join('/')]
      .filter(Boolean)
      .join(' ')
      .trim();
    const cityLabel = a.cityPart ? [a.cityPart, a.city].filter(Boolean).join(', ') : a.city;
    const line2 = [[a.postalCode, cityLabel].filter(Boolean).join(' ').trim(), a.countryCode]
      .filter(Boolean)
      .join(', ');
    const result = [line1, line2].filter(Boolean).join(', ');
    return result || undefined;
  };
  const address = React.useMemo(
    () => formatAddress(state.data?.billingAddress),
    [state.data?.billingAddress]
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCustomer(id);
      onClose();
      onDeleted?.();
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.WRITE, RBAC_AREAS.CUSTOMERS.READ]}>
      <DetailDrawer
        open
        onClose={onClose}
        title="Detail zákazníka"
        headerRight={
          <>
            <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.WRITE, RBAC_AREAS.CUSTOMERS.UPDATE]}>
              <button className="btn btn-secondary btn-sm" onClick={() => onEdit?.()}>
                Upravit
              </button>
            </ScopeGuard>
            <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.WRITE, RBAC_AREAS.CUSTOMERS.DELETE]}>
              <button className="btn btn-error btn-sm" onClick={() => setShowConfirm(true)}>
                Smazat
              </button>
            </ScopeGuard>
          </>
        }
      >
        {state.loading && <Loading />}
        {state.error && <ErrorState title={state.error.title} description={state.error.detail} />}
        {state.data && (
          <section className="space-y-4">
            <div>
              <h3 className="text-base font-medium">{state.data.name}</h3>
              <p className="text-sm text-[rgb(var(--sb-muted))]">{state.data.email ?? '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium">Typ:</span> {state.data.type}</div>
              <div><span className="font-medium">Telefon:</span> {state.data.phone ?? '—'}</div>
              <div><span className="font-medium">IČO:</span> {state.data.ico ?? '—'}</div>
              <div><span className="font-medium">DIČ:</span> {state.data.dic ?? '—'}</div>
              <div className="col-span-2">
                <span className="font-medium">Adresa:</span> {address ?? '—'}
              </div>
              <div className="col-span-2"><span className="font-medium">Poznámka:</span> {state.data.notes ?? '—'}</div>
            </div>
            {state.data.updatedAt ? (
              <div className="text-xs text-[rgb(var(--sb-muted))]">
                Aktu­alizováno: {new Date(state.data.updatedAt).toLocaleString()}
              </div>
            ) : null}
          </section>
        )}
      </DetailDrawer>
      <ConfirmModal
        open={showConfirm}
        title="Smazat zákazníka?"
        description="Akce je nevratná. Zákazník bude odstraněn."
        confirmLabel="Smazat"
        danger
        confirming={deleting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleDelete}
      />
    </ScopeGuard>
  );
}