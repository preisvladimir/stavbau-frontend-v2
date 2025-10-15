// src/features/customers/components/Detail.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import AddressBlock from '@/components/common/AddressBlock';
import EntityHeader from '@/components/ui/stavbau-ui/deprecated.detail/EntityHeader';



//import { RBAC_AREAS } from '@/lib/rbac/areas';
import { Mail, Phone } from '@/components/icons';
import { toApiProblem } from '@/lib/api/problem';


import {Button, ConfirmModal, InlineStatus, useFeedback } from '@/ui';
import { ScopeGuard, sc } from '@/rbac';
import type { UUID } from '@/types';
import type { CustomerDto } from '../api/types';

export type CustomerDetailProps = {
  i18nNamespaces?: string[];
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: (id: UUID) => Promise<void> | void;

  data?: Partial<CustomerDto> | null;
  loading?: boolean;
  error?: string | null;

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

  const feedback = useFeedback();
  const SCOPE = 'customers.detail';

  // když orchestrátor dodá error (např. selhal fetch detailu),
  // pošli ho do inline statusu (jen když je šuplík otevřený)
  React.useEffect(() => {
    if (!open) return;
    if (error) {
      feedback.show({
        severity: 'error',
        title: t('errors.loadFailed', { defaultValue: 'Detail se nepodařilo načíst.' }),
        description: error,
        scope: SCOPE,
      });
    }
  }, [open, error, feedback, t]);

  React.useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
      setBusy(false);
      // po zavření případné inline hlášky vyčistíme (ať se nepřenese jinam)
      feedback.clear(SCOPE);
    }
  }, [open, feedback]);

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

      // 👉 úspěch bez scope => zobrazí se toast (detail se hned zavře)
      feedback.show({
        severity: 'success',
        title: t('detail.toasts.deleted.title', { defaultValue: 'Zákazník smazán' }),
        description: (data?.name as string) || id,
      });

      setConfirmOpen(false);
      onClose();
      onMutated?.();
    } catch (err) {
      const p = toApiProblem(err);

      // 403 typicky řeší globální guard – jen zavři confirm
      if (p.status === 403) {
        setConfirmOpen(false);
        return;
      }

      // 👉 chyba do inline (scope přítomný v detailu)
      feedback.show({
        severity: 'error',
        title: t('detail.errors.delete.title', { defaultValue: 'Nelze smazat' }),
        description: p.detail ?? t('errors.tryAgain', { defaultValue: 'Zkuste to prosím znovu.' }),
        scope: SCOPE,
      });
    } finally {
      setBusy(false);
    }
  };

  const headerActions = (
    <>
      <ScopeGuard anyOf={[sc.customers.update]}>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} disabled={!!loading || busy}>
            {t('detail.actions.edit', { defaultValue: 'Upravit' })}
          </Button>
        )}
      </ScopeGuard>
      <ScopeGuard anyOf={[sc.customers.delete]}>
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
      <div className="flex flex-col gap-4 p-6">

        {/* ✅ Globální inline status pro detail zákazníka */}
        <InlineStatus scope={SCOPE} />

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
            <ScopeGuard anyOf={[sc.customers.update]}>
              {onEdit && (
                <Button variant="outline" onClick={onEdit} disabled={!!loading || busy}>
                  {t('detail.actions.edit', { defaultValue: 'Upravit' })}
                </Button>
              )}
            </ScopeGuard>
            <ScopeGuard anyOf={[sc.customers.delete]}>
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
