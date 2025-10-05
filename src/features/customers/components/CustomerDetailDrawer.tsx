// src/features/customers/components/CustomerDetailDrawer.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import { Button } from '@/components/ui/stavbau-ui/button';
import { ConfirmModal } from '@/components/ui/stavbau-ui/modal/confirm-modal';

import { getCustomer, deleteCustomer } from '../api/client';
import type { CustomerDto } from '../api/types';
import type { AddressDto } from '@/types/common/address';

import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { RBAC_AREAS } from '@/lib/rbac/areas';

export type CustomerDetailDrawerProps = {
  i18nNamespaces?: string[];
  open: boolean;
  id?: string | null;
  onClose: () => void;
  onEdit?: () => void;
  onDeleted?: () => void;
  /** Rychlý render před fetchem */
  prefill?: Partial<CustomerDto>;
};

export function CustomerDetailDrawer({
  i18nNamespaces = ['customers'],
  open,
  id,
  onClose,
  onEdit,
  onDeleted,
  prefill,
}: CustomerDetailDrawerProps) {
  const { t } = useTranslation(i18nNamespaces);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<CustomerDto | null>(prefill ? (prefill as CustomerDto) : null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open || !id) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    getCustomer(id, { signal: ac.signal })
      .then((d) => setData(d))
      .catch((e: any) => {
        // fallback na prefill; chybu zobrazíme decentně nahoře
        setData(prefill ? (prefill as CustomerDto) : null);
        setError(e?.response?.data?.detail || e?.message || 'Failed to load');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  // --- Helpers ---
  type DateLike = string | number | Date | null | undefined;

  const safeDateTime = (v: DateLike): string =>
    v ? new Date(v as any).toLocaleString() : '—';

  const formatAddress = (a?: AddressDto): string | undefined => {
    if (!a) return undefined;
    const formatted = a.formatted?.trim();
    if (formatted) return formatted;

    const line1 = [a.street, [a.houseNumber, a.orientationNumber].filter(Boolean).join('/')].filter(Boolean).join(' ').trim();
    const cityLabel = a.cityPart ? [a.cityPart, a.city].filter(Boolean).join(', ') : a.city;
    const line2 = [[a.postalCode, cityLabel].filter(Boolean).join(' ').trim(), a.countryCode].filter(Boolean).join(', ');
    const result = [line1, line2].filter(Boolean).join(', ');
    return result || undefined;
  };

  const handleDelete = async () => {
    if (!data?.id) return;
    await deleteCustomer(String(data.id));
    setConfirmOpen(false);
    onClose();
    onDeleted?.();
  };

  // Skeleton pro načítání
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  );

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={t('detail.title', { defaultValue: 'Detail zákazníka' })}
      headerRight={
        <>
          <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.UPDATE, RBAC_AREAS.CUSTOMERS.WRITE]}>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                {t('detail.actions.edit', { defaultValue: 'Upravit' })}
              </Button>
            )}
          </ScopeGuard>
          <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.DELETE, RBAC_AREAS.CUSTOMERS.WRITE]}>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              {t('detail.actions.delete', { defaultValue: 'Smazat' })}
            </Button>
          </ScopeGuard>
        </>
      }
    >
      {/* Error banner (není blocking – můžeme mít prefill) */}
      {!loading && error && (
        <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t('error', { defaultValue: 'Chyba načtení.' })} {process.env.NODE_ENV !== 'production' ? `(${error})` : null}
        </div>
      )}

      {/* Obsah */}
      <div className="flex flex-col gap-4 p-6">
        {/* Header panel */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            {loading ? (
              <Skeleton className="h-14 w-14 rounded-full" />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {(data?.name || 'C').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name + primary info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">
                {loading ? <Skeleton className="h-5 w-48" /> : (data?.name ?? '—')}
              </h2>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="opacity-70">{t('detail.email', { defaultValue: 'E-mail' })}:</span>
              {loading ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                <span className="font-medium">{data?.email ?? '—'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Identifikace */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.identity.title', { defaultValue: 'Identifikace' })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.type', { defaultValue: 'Typ' })}</div>
                <div>{loading ? <Skeleton className="h-4 w-24" /> : (data?.type ?? '—')}</div>
              </div>
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.phone', { defaultValue: 'Telefon' })}</div>
                <div>{loading ? <Skeleton className="h-4 w-24" /> : (data?.phone ?? '—')}</div>
              </div>
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.ico', { defaultValue: 'IČO' })}</div>
                <div className="font-mono">{loading ? <Skeleton className="h-4 w-20" /> : (data?.ico ?? '—')}</div>
              </div>
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.dic', { defaultValue: 'DIČ' })}</div>
                <div className="font-mono">{loading ? <Skeleton className="h-4 w-24" /> : (data?.dic ?? '—')}</div>
              </div>
            </div>
          </div>

          {/* Fakturační adresa */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.address.title', { defaultValue: 'Fakturační adresa' })}
            </div>
            <div className="text-sm">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-4 w-[40%]" />
                </div>
              ) : (
                formatAddress(data?.billingAddress) ?? '—'
              )}
            </div>
          </div>

          {/* Poznámka */}
          <div className="rounded-xl border p-4 md:col-span-2">
            <div className="mb-2 text-sm font-medium">{t('detail.notes', { defaultValue: 'Poznámka' })}</div>
            <div className="text-sm text-gray-700">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full max-w-[520px]" />
                  <Skeleton className="h-4 w-full max-w-[460px]" />
                  <Skeleton className="h-4 w-full max-w-[380px]" />
                </div>
              ) : data?.notes ? (
                <p className="whitespace-pre-wrap">{data.notes}</p>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-[rgb(var(--sb-muted))]">
          {t('detail.updatedAt', { defaultValue: 'Aktualizováno' })}: {safeDateTime(data?.updatedAt)}
        </div>

        {/* Footer actions (duplicitně pro pohodlí uživatele) */}
        {(onEdit || true) && (
          <div className="mt-2 flex justify-end gap-2">
            <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.UPDATE, RBAC_AREAS.CUSTOMERS.WRITE]}>
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  {t('detail.actions.edit', { defaultValue: 'Upravit' })}
                </Button>
              )}
            </ScopeGuard>
            <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.DELETE, RBAC_AREAS.CUSTOMERS.WRITE]}>
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                {t('detail.actions.delete', { defaultValue: 'Smazat' })}
              </Button>
            </ScopeGuard>
          </div>
        )}
      </div>

      {/* Confirm delete */}
      <ConfirmModal
        open={confirmOpen}
        title={t('detail.deleteConfirm.title', { defaultValue: 'Smazat zákazníka?' })}
        description={t('detail.deleteConfirm.desc', { defaultValue: 'Tato akce je nevratná.' })}
        confirmLabel={t('detail.deleteConfirm.confirm', { defaultValue: 'Smazat' })}
        cancelLabel={t('detail.deleteConfirm.cancel', { defaultValue: 'Zrušit' })}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </DetailDrawer>
  );
}
