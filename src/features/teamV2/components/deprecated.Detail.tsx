// src/features/team/components/TeamDetail.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import { Button } from '@/components/ui/stavbau-ui/button';
import { ConfirmModal } from '@/components/ui/stavbau-ui/modal/confirm-modal';
import { Mail, Phone, Shield, Clock } from '@/components/icons';
import EntityHeader from '@/components/ui/stavbau-ui/detail/EntityHeader';
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { TEAM_SCOPES } from '@/features/teamV2/const/scopes';

import { toast } from '@/components/ui/stavbau-ui/toast';
import { toApiProblem } from '@/lib/api/problem';

import type { MemberDto, UUID } from '../api/types';

export type DetailProps = {
  /** Ovládání otevření/zavření (řídí rodič / CrudDrawer) */
  open: boolean;
  onClose: () => void;

  /** Akce z rodiče */
  onEdit?: () => void;
  onDelete?: (id: UUID) => Promise<void> | void;

  /** Data (primární režim) – posílá rodič nebo CrudDrawer */
  data?: Partial<MemberDto> | null;
  loading?: boolean;
  error?: string | null;

  /** i18n */
  i18nNamespaces?: string[];

  /** Po úspěšné mutaci (mazání) – trigger na refresh seznamu apod. */
  onMutated?: () => void;
};

export function Detail({
  open,
  onClose,
  onEdit,
  onDelete,
  data,
  loading,
  i18nNamespaces = ['team', 'common'],
  onMutated,
}: DetailProps) {
  const { t } = useTranslation(i18nNamespaces);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // reset confirm/busy při zavření šuplíku (parita s ostatními)
  React.useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
      setBusy(false);
    }
  }, [open]);

  // ---- Helpers ----
  const safeDate = (v?: string | number | Date): string =>
    v ? new Date(v).toLocaleString?.() || String(v) : '—';

  const fullName = (m?: Partial<MemberDto> | null): string => {
    if (!m) return '';
    const composed = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
    return composed || (m as any).name || m.email || '—';
  };

  const roleLabel = (r?: string | null) => (r ? t(`roles.${r}`, { defaultValue: r }) : '—');

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} />
  );

  const handleDelete = async () => {
    if (!data?.id || !onDelete) return;
    const id = data.id as UUID;

    try {
      setBusy(true);
      await onDelete(id);

      toast.show({
        variant: 'success',
        title: t('detail.toasts.deleted.title', { defaultValue: 'Člen smazán' }),
        description: fullName(data) || id,
      });

      setConfirmOpen(false);
      onClose();
      onMutated?.();
    } catch (err) {
      const p = toApiProblem(err);

      // 403 obvykle pokrývá globální onForbidden (zde ticho a zavřít confirm)
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
      <ScopeGuard anyOf={[TEAM_SCOPES.UPDATE]}>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} disabled={!!loading || busy}>
            {t('detail.actions.edit', { defaultValue: 'Upravit' })}
          </Button>
        )}
      </ScopeGuard>
      <ScopeGuard anyOf={[TEAM_SCOPES.DELETE]}>
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={!!loading || busy}
          >
            {t('detail.actions.delete', { defaultValue: 'Smazat' })}
          </Button>
        )}
      </ScopeGuard>
    </>
  );

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={t('detail.title', { defaultValue: 'Detail člena' })}
      headerRight={headerActions}
    >
      {/* Obsah */}
      <div className="flex flex-col gap-4 p-6">
        {/* Header */}
        <EntityHeader
          loading={!!loading}
          title={fullName(data)}
          badges={
            (data as any)?.status
              ? [
                  {
                    label: t(`badges.${(data as any).status}`, { defaultValue: (data as any).status }),
                    tone:
                      (data as any).status === 'ACTIVE'
                        ? 'success'
                        : (data as any).status === 'INVITED'
                        ? 'warning'
                        : 'neutral',
                  },
                ]
              : undefined
          }
          metaLayout="stack"
          meta={[
            {
              icon: <Mail size={14} className="opacity-60" />,
              label: t('detail.email', { defaultValue: 'E-mail' }),
              value: data?.email,
              href: data?.email ? `mailto:${data.email}` : undefined,
              copyValue: data?.email ?? undefined,
            },
            {
              icon: <Phone size={14} className="opacity-60" />,
              label: t('form.phone', { defaultValue: 'Telefon' }),
              value: (data as any)?.phone,
              href: (data as any)?.phone ? `tel:${(data as any).phone}` : undefined,
              copyValue: (data as any)?.phone ?? undefined,
            },
          ]}
          avatar={{ initialsFrom: fullName(data) || data?.email || 'U' }}
        />

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Kontakt */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.contact.title', { defaultValue: 'Kontakt' })}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="opacity-70">{t('form.phone', { defaultValue: 'Telefon' })}</span>
                <span className="flex items-center gap-2">
                  <Phone size={14} className="opacity-60" />
                  {loading ? (
                    <Skeleton className="h-4 w-28" />
                  ) : (data as any)?.phone ? (
                    <a href={`tel:${(data as any).phone}`} className="underline decoration-dotted underline-offset-2">
                      {(data as any).phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Role & přístupy */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.roleAccess.title', { defaultValue: 'Role & přístupy' })}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="opacity-70">{t('detail.companyRole', { defaultValue: 'Firemní role' })}</span>
                <span className="inline-flex items-center gap-1">
                  <Shield size={14} className="opacity-60" />
                  {loading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    roleLabel((data as any)?.companyRole ?? (data as any)?.role)
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={t('detail.createdAt', { defaultValue: 'Vytvořeno' })}
                  value={loading ? null : safeDate((data as any)?.createdAt)}
                />
                <Field
                  label={t('detail.updatedAt', { defaultValue: 'Upraveno' })}
                  value={loading ? null : safeDate((data as any)?.updatedAt)}
                />
              </div>

              <div className="mt-2 text-xs opacity-70">
                {t('detail.roleAccess.projectsHint', { defaultValue: 'Projektové role budou doplněny později.' })}
              </div>
            </div>
          </div>

          {/* Aktivita */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.activity.title', { defaultValue: 'Aktivita' })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="opacity-70">
                  {t('detail.lastLoginAt', { defaultValue: 'Poslední přihlášení' })}
                </div>
                <div className="inline-flex items-center gap-1">
                  <Clock size={14} className="opacity-60" />
                  {loading ? (
                    <Skeleton className="h-4 w-28" />
                  ) : (
                    <span>{safeDate((data as any)?.lastLoginAt)}</span>
                  )}
                </div>
              </div>
              {/* prostor pro další metriky */}
            </div>
          </div>

          {/* Adresy – placeholder (pro budoucí rozšíření) */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.address.title', { defaultValue: 'Adresy' })}
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <div className="mb-1 text-xs opacity-70">
                  {t('detail.address.permanent', { defaultValue: 'Trvalá' })}
                </div>
                <div className="text-gray-700">—</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="mb-1 text-xs opacity-70">
                  {t('detail.address.shipping', { defaultValue: 'Doručovací' })}
                </div>
                <div className="text-gray-700">—</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {(onEdit || onDelete) && (
          <div className="mt-2 flex justify-end gap-2">
            <ScopeGuard anyOf={[TEAM_SCOPES.UPDATE]}>
              {onEdit && (
                <Button variant="outline" onClick={onEdit} disabled={!!loading || busy}>
                  {t('detail.actions.edit', { defaultValue: 'Upravit' })}
                </Button>
              )}
            </ScopeGuard>
            <ScopeGuard anyOf={[TEAM_SCOPES.DELETE]}>
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!!loading || busy}
                >
                  {t('detail.actions.delete', { defaultValue: 'Smazat' })}
                </Button>
              )}
            </ScopeGuard>
          </div>
        )}
      </div>

      {/* Confirm delete */}
      <ConfirmModal
        open={confirmOpen}
        title={t('detail.deleteConfirm.title', { defaultValue: 'Smazat člena?' })}
        description={t('detail.deleteConfirm.desc', { defaultValue: 'Tato akce je nevratná.' })}
        confirmLabel={t('detail.deleteConfirm.confirm', { defaultValue: 'Smazat' })}
        cancelLabel={t('detail.deleteConfirm.cancel', { defaultValue: 'Zrušit' })}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        // bezpečné chování během akce
        disableOutsideClose={busy}
        disableEscapeClose={busy}
        confirmDisabled={false}
        closeOnConfirm={false}
      />
    </DetailDrawer>
  );
}

function Field({ label, value }: { label: React.ReactNode; value: React.ReactNode | null }) {
  return (
    <div className="space-y-1">
      <div className="opacity-70">{label}</div>
      <div className="min-h-[1.25rem]">
        {value === null ? (
          <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" />
        ) : (
          <span className="font-medium">{value || '—'}</span>
        )}
      </div>
    </div>
  );
}

export default Detail;
