// src/features/customers/components/Detail.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import AddressBlock from '@/components/common/AddressBlock';
import EntityHeader from '@/components/ui/stavbau-ui/detail/EntityHeader';
import { Button } from '@/components/ui/stavbau-ui/button';
import { ConfirmModal } from '@/components/ui/stavbau-ui/modal/confirm-modal';
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { RBAC_AREAS } from '@/lib/rbac/areas';
import { Mail, Phone } from '@/components/icons';
import LoadErrorStatus from '@/components/ui/stavbau-ui/feedback/LoadErrorStatus';

import { toast } from '@/components/ui/stavbau-ui/toast';
import { toApiProblem } from '@/lib/api/problem';

import type { CustomerDto, UUID } from '../api/types';

export type CustomerDetailProps = {
  i18nNamespaces?: string[];
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: (id: UUID) => Promise<void> | void;

  /** Data a stav dodává orchestrace (CrudDrawer) */
  data?: Partial<CustomerDto> | null;
  loading?: boolean;
  error?: string | null;
  /** Po úspěšné mutaci (např. smazání) – trigger na refresh seznamu apod. */
  onMutated?: () => void;
};

export function Detail({
  i18nNamespaces = ['customers', 'common'],
  open,
  onClose,
  onEdit,
  onDelete,
  data,
  loading,
  error,
  onMutated,
}: CustomerDetailProps) {
  const { t, i18n } = useTranslation(i18nNamespaces);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // Při zavření šuplíku vynulujeme stav potvrzení
  React.useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
      setBusy(false);
    }
  }, [open]);

  const safeDateTime = (v?: string | number | Date | null) =>
    v ? new Date(v as any).toLocaleString(i18n.language || undefined) : '—';
  const textOrDash = (v?: React.ReactNode) => (v == null || v === '' ? '—' : v);

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  );

  const handleDelete = async () => {
    if (!data?.id || !onDelete) return;
    const id = data.id as UUID;

    try {
      setBusy(true);
      await onDelete(id);
      toast.show({
        variant: 'success',
        title: t('detail.toasts.deleted.title', { defaultValue: 'Zákazník smazán' }),
        description: (data?.name as string) || id,
      });
      setConfirmOpen(false);
      onClose();
      onMutated?.();
    } catch (err) {
      const p = toApiProblem(err);

      // 403 pokrývá globální onForbidden – zde jen tiše zavřeme confirm
      if (p.status === 403) {
        setConfirmOpen(false);
        return;
      }

      toast.show({
        variant: 'error',
        title: t('detail.errors.delete.title', { defaultValue: 'Nelze smazat' }),
        description: p.detail ?? t('errors.tryAgain', { defaultValue: 'Zkuste to prosím znovu.' }),
      });
    } finally {
      setBusy(false);
    }
  };

  const headerActions = (
    <>
      <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.UPDATE, RBAC_AREAS.CUSTOMERS.WRITE]}>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} disabled={!!loading || busy}>
            {t('detail.actions.edit', { defaultValue: 'Upravit' })}
          </Button>
        )}
      </ScopeGuard>
      <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.DELETE, RBAC_AREAS.CUSTOMERS.WRITE]}>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={!!loading || busy}
        >
          {t('detail.actions.delete', { defaultValue: 'Smazat' })}
        </Button>
      </ScopeGuard>
    </>
  );

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={t('detail.title', { defaultValue: 'Detail zákazníka' })}
      headerRight={headerActions}
    >
      {/* Error/Status banner (není blocking) */}
      {!!(loading || error) && (
        <LoadErrorStatus
          loading={loading}
          error={error}
          onClear={onClose}
          i18nNamespaces={i18nNamespaces}
        />
      )}

      <div className="flex flex-col gap-4 p-6">
        {/* Header */}
        <EntityHeader
          loading={!!loading}
          title={textOrDash(data?.name) as string}
          metaLayout="stack"
          meta={[
            {
              icon: <Mail size={14} className="opacity-60" />,
              label: t('detail.email', { defaultValue: 'E-mail' }),
              value: (data as any)?.email,
              href: (data as any)?.email ? `mailto:${(data as any).email}` : undefined,
              copyValue: (data as any)?.email ?? undefined,
            },
            {
              icon: <Phone size={14} className="opacity-60" />,
              label: t('detail.phone', { defaultValue: 'Telefon' }),
              value: (data as any)?.phone,
              href: (data as any)?.phone ? `tel:${(data as any).phone}` : undefined,
              copyValue: (data as any)?.phone ?? undefined,
            },
          ]}
          avatar={{ initialsFrom: (data?.name || (data as any)?.email || 'C') as string }}
        />

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

          <AddressBlock
            title={t('detail.address.title', { defaultValue: 'Fakturační adresa' })}
            address={data?.billingAddress}
            loading={!!loading}
            showSource
            showMapLink
            compact
          />

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

        <div className="text-xs text-[rgb(var(--sb-muted))]">
          {t('detail.updatedAt', { defaultValue: 'Aktualizováno' })}: {safeDateTime((data as any)?.updatedAt)}
        </div>

        {(onEdit || onDelete) && (
          <div className="mt-2 flex justify-end gap-2">
            <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.UPDATE, RBAC_AREAS.CUSTOMERS.WRITE]}>
              {onEdit && (
                <Button variant="outline" onClick={onEdit} disabled={!!loading || busy}>
                  {t('detail.actions.edit', { defaultValue: 'Upravit' })}
                </Button>
              )}
            </ScopeGuard>
            <ScopeGuard anyOf={[RBAC_AREAS.CUSTOMERS.DELETE, RBAC_AREAS.CUSTOMERS.WRITE]}>
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={!!loading || busy}
              >
                {t('detail.actions.delete', { defaultValue: 'Smazat' })}
              </Button>
            </ScopeGuard>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={t('detail.deleteConfirm.title', { defaultValue: 'Smazat zákazníka?' })}
        description={t('detail.deleteConfirm.desc', { defaultValue: 'Tato akce je nevratná.' })}
        confirmLabel={t('detail.deleteConfirm.confirm', { defaultValue: 'Smazat' })}
        cancelLabel={t('detail.deleteConfirm.cancel', { defaultValue: 'Zrušit' })}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        // Politiky zavírání při běhu akce
        disableOutsideClose={busy}
        disableEscapeClose={busy}
        confirmDisabled={false}
        closeOnConfirm={false}
      />
    </DetailDrawer>
  );
}

function Field({ label, value, mono }: { label: React.ReactNode; value: React.ReactNode | null; mono?: boolean }) {
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

export default Detail;
