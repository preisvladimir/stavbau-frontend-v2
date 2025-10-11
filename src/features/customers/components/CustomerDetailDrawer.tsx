// src/features/customers/components/CustomerDetailDrawer.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import AddressBlock from '@/components/common/AddressBlock';
import { Button } from '@/components/ui/stavbau-ui/button';
import { ConfirmModal } from '@/components/ui/stavbau-ui/modal/confirm-modal';

import { getCustomer, deleteCustomer } from '../api/client';
import type { CustomerDto, UUID } from '../api/types';
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { RBAC_AREAS } from '@/lib/rbac/areas';

export type CustomerDetailDrawerProps = {
  i18nNamespaces?: string[];
  open: boolean;
  companyId: UUID;
  id: UUID | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: (id: UUID) => Promise<void> | void;
  /** Rychlý render před fetchem */
  prefill?: Partial<CustomerDto>;
};

export function CustomerDetailDrawer({
  i18nNamespaces = ['customers', 'common'],
  open,
  companyId,
  id,
  onClose,
  onEdit,
  onDelete,
  prefill,
}: CustomerDetailDrawerProps) {
  const { t, i18n } = useTranslation(i18nNamespaces);

  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<CustomerDto | null>(prefill ? (prefill as CustomerDto) : null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // ---- fetch detail (stejný vzor jako u ProjectDetailDrawer) ----
  const fetchDetail = React.useCallback(
    (signal?: AbortSignal) =>
      getCustomer(companyId, id as UUID, { signal })
        .then((d) => setData(d))
        .catch((e: any) => {
          setError(e?.response?.data?.detail || e?.message || 'Failed to load');
          // prefill může zůstat jako last-known
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        }),
    [companyId, id]
  );

  React.useEffect(() => {
    if (!open || !id) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    void fetchDetail(ac.signal);
    return () => ac.abort();
  }, [open, id, fetchDetail]);

  // ---- helpers ----
  type DateLike = string | number | Date | null | undefined;
  const safeDateTime = (v: DateLike): string =>
    v ? new Date(v as any).toLocaleString(i18n.language || undefined) : '—';
  const textOrDash = (v?: React.ReactNode) => (v == null || v === '' ? '—' : v);

  const initials = (label?: string): string => {
    const src = (label ?? 'C').trim();
    if (!src) return 'C';
    const parts = src.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? src[0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';
    return (first + (last || '')).toUpperCase();
  };

  const copyToClipboard = (val?: string) => {
    if (!val) return;
    void navigator.clipboard?.writeText(val);
  };

  // ---- actions ----
  const handleDelete = async () => {
    if (!data?.id) return;
    await deleteCustomer(companyId, data.id as UUID);
    setConfirmOpen(false);
    onClose();
    onDelete?.(data.id as UUID);
  };

  const headerActions = (
    <>
      <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.UPDATE, RBAC_AREAS.CUSTOMERS.WRITE]}>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} disabled={loading}>
            {t('detail.actions.edit', { defaultValue: 'Upravit' })}
          </Button>
        )}
      </ScopeGuard>
      <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.DELETE, RBAC_AREAS.CUSTOMERS.WRITE]}>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
        >
          {t('detail.actions.delete', { defaultValue: 'Smazat' })}
        </Button>
      </ScopeGuard>
    </>
  );

  // Skeleton
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  );

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={t('detail.title', { defaultValue: 'Detail zákazníka' })}
      headerRight={headerActions}
    >
      {/* Error banner + Retry */}
      {!loading && error && (
        <div className="mx-6 mt-4 flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>
            {t('error', { defaultValue: 'Chyba načtení.' })}{' '}
            {process.env.NODE_ENV !== 'production' ? `(${error})` : null}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const ac = new AbortController();
              setLoading(true);
              setError(null);
              void fetchDetail(ac.signal);
            }}
          >
            {t('retry', { defaultValue: 'Zkusit znovu' })}
          </Button>
        </div>
      )}

      {/* Obsah */}
      <div className="flex flex-col gap-4 p-6">
        {/* Header panel (sjednocený styl) */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            {loading ? (
              <Skeleton className="h-14 w-14 rounded-full" />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {initials(data?.name || data?.email || 'C')}
              </span>
            )}
          </div>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">
                {loading ? <Skeleton className="h-5 w-48" /> : textOrDash(data?.name)}
              </h2>
            </div>

            {/* Email + kopírovat */}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="opacity-70">{t('detail.email', { defaultValue: 'E-mail' })}:</span>
              {loading ? (
                <span className="inline-block h-4 w-40 animate-pulse rounded bg-gray-200" />
              ) : (
                <>
                  <span className="font-medium">{textOrDash(data?.email)}</span>
                  {!!data?.email && (
                    <button
                      type="button"
                      className="underline decoration-gray-300 underline-offset-2 hover:opacity-80"
                      onClick={() => copyToClipboard(data.email!)}
                      title={t('copy', { defaultValue: 'Kopírovat' }) as string}
                    >
                      {t('copy', { defaultValue: 'Kopírovat' })}
                    </button>
                  )}
                </>
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
              <Field label={t('detail.type', { defaultValue: 'Typ' })} value={loading ? null : textOrDash(data?.type)} />
              <Field label={t('detail.phone', { defaultValue: 'Telefon' })} value={loading ? null : textOrDash(data?.phone)} />
              <Field label={t('detail.ico', { defaultValue: 'IČO' })} value={loading ? null : textOrDash(data?.ico)} mono />
              <Field label={t('detail.dic', { defaultValue: 'DIČ' })} value={loading ? null : textOrDash(data?.dic)} mono />
            </div>
          </div>

          {/* Fakturační adresa (sjednoceno přes AddressBlock) */}
          <AddressBlock
            title={t('detail.address.title', { defaultValue: 'Fakturační adresa' })}
            address={data?.billingAddress}
            loading={loading}
            showSource
            showMapLink
            compact
          />

          {/* Poznámka */}
          <div className="rounded-xl border p-4 md:col-span-2">
            <div className="mb-2 text-sm font-medium">
              {t('detail.notes', { defaultValue: 'Poznámka' })}
            </div>
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

        {/* Footer actions */}
        {(onEdit || onDelete) && (
          <div className="mt-2 flex justify-end gap-2">
            <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.UPDATE, RBAC_AREAS.CUSTOMERS.WRITE]}>
              {onEdit && (
                <Button variant="outline" onClick={onEdit} disabled={loading}>
                  {t('detail.actions.edit', { defaultValue: 'Upravit' })}
                </Button>
              )}
            </ScopeGuard>
            <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.DELETE, RBAC_AREAS.CUSTOMERS.WRITE]}>
              <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={loading}>
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

function Field({
  label,
  value,
  mono,
}: {
  label: React.ReactNode;
  value: React.ReactNode | null;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="opacity-70">{label}</div>
      <div className="min-h-[1.25rem]">
        {value === null ? (
          <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" />
        ) : (
          <span className={mono ? 'font-medium font-mono' : 'font-medium'}>{value || '—'}</span>
        )}
      </div>
    </div>
  );
}

export default CustomerDetailDrawer;
