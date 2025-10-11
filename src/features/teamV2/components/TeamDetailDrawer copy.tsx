import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import { Button } from '@/components/ui/stavbau-ui/button';
import { ConfirmModal } from '@/components/ui/stavbau-ui//modal/confirm-modal';
import { Mail, Phone, Shield, Clock, Copy } from '@/components/icons';
import type { MemberDto, UUID } from '../api/types';
import { getMember } from '../api/client';

export type TeamDetailDrawerProps = {
  open: boolean;
  companyId: UUID;
  memberId: UUID | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: (id: UUID) => Promise<void> | void;
  /** Rychlý render před fetchem */
  prefill?: Partial<MemberDto>;
  /** Vlastní i18n namespace(y) – default: ['team'] */
  i18nNamespaces?: string[];
};

export function TeamDetailDrawer({
  open,
  companyId,
  memberId,
  onClose,
  onEdit,
  onDelete,
  prefill,
  i18nNamespaces = ['team'],
}: TeamDetailDrawerProps) {
  const { t } = useTranslation(i18nNamespaces);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<MemberDto | null>(prefill ? (prefill as MemberDto) : null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open || !memberId) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    getMember(companyId, memberId, { signal: ac.signal })
      .then((d) => setData(d))
      .catch((e) => {
        // fallback na prefill; chybu zobrazíme decentně nahoře
        setData(prefill ? (prefill as MemberDto) : null);
        setError(e?.response?.data?.detail || e?.message || 'Failed to load');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [open, companyId, memberId]);

  const handleDelete = async () => {
    if (!data?.id || !onDelete) return;
    await onDelete(data.id as UUID);
    setConfirmOpen(false);
    onClose();
  };

  // --- Helpers ---
  const safeDate = (v?: string | number | Date): string =>
    v ? new Date(v).toLocaleString?.() || String(v) : '—';

  const fullName = (m?: Partial<MemberDto> | null): string => {
    if (!m) return '';
    const composed = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
    return composed || m.email || '—';
  };

  const initials = (label: string): string => {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts[parts.length - 1]?.[0] ?? '';
    return (first + last).toUpperCase() || (label[0] || '?').toUpperCase();
  };

  const copyToClipboard = async (text?: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // no-op; nechceme výjimky do UI
    }
  };

  const roleLabel = (r?: string | null) => (r ? t(`roles.${r}`, { defaultValue: r }) : '—');

  const statusBadge = (status?: string | null) => {
    if (!status) return null;
    const label = t(`badges.${status}`, { defaultValue: status });
    const className =
      status === 'ACTIVE'
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : status === 'INVITED'
          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
          : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200';
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${className}`}>{label}</span>;
  };

  // Skeleton pro načítání
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} />
  );

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={t('detail.title', { defaultValue: 'Detail člena' })}
      headerRight={
        <>
          {/* Actions */}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              {t('detail.actions.edit', { defaultValue: 'Upravit' })}
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
              {t('detail.actions.delete', { defaultValue: 'Smazat' })}
            </Button>
          )}
        </>
      }
    >
      {/* Error banner (není blocking – můžeme mít prefill) */}
      {!loading && error && (
        <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t('error', { defaultValue: 'Chyba načtení.' })}{' '}
          {process.env.NODE_ENV !== 'production' ? `(${error})` : null}
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
                {initials(fullName(data) || data?.email || 'U')}
              </span>
            )}
          </div>
          {/* Name + primary info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">
                {loading ? <Skeleton className="h-5 w-48" /> : fullName(data)}
              </h2>
              {!loading && statusBadge(data?.status)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Mail size={14} />
                {loading ? (
                  <Skeleton className="h-4 w-40" />
                ) : data?.email ? (
                  <a href={`mailto:${data.email}`} className="underline decoration-dotted underline-offset-2">
                    {data.email}
                  </a>
                ) : (
                  '—'
                )}
              </span>
              {data?.email && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('detail.copyEmail', { defaultValue: 'Kopírovat e-mail' }) as string}
                  onClick={() => copyToClipboard(data.email)}
                  leftIcon={<Copy size={14} />}
                >
                  {t('detail.copy', { defaultValue: 'Kopírovat' })}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Kontakt */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">{t('detail.contact.title', { defaultValue: 'Kontakt' })}</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="opacity-70">{t('form.phone', { defaultValue: 'Telefon' })}</span>
                <span className="flex items-center gap-2">
                  <Phone size={14} className="opacity-60" />
                  {loading ? (
                    <Skeleton className="h-4 w-28" />
                  ) : data?.phone ? (
                    <a href={`tel:${data.phone}`} className="underline decoration-dotted underline-offset-2">
                      {data.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              {/* Rezerva pro další kanály: Slack/Teams handle apod. */}
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
                  {loading ? <Skeleton className="h-4 w-24" /> : roleLabel((data as any)?.companyRole ?? data?.role)}
                </span>
              </div>

              {/* Budoucí: projektové role (collapsible) */}
              <div className="mt-2 text-xs opacity-70">
                {t('detail.roleAccess.projectsHint', {
                  defaultValue: 'Projektové role budou doplněny později.',
                })}
              </div>
            </div>
          </div>

          {/* Aktivita */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">{t('detail.activity.title', { defaultValue: 'Aktivita' })}</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.lastLoginAt', { defaultValue: 'Poslední přihlášení' })}</div>
                <div className="inline-flex items-center gap-1">
                  <Clock size={14} className="opacity-60" />
                  {loading ? <Skeleton className="h-4 w-28" /> : <span>{safeDate((data as any)?.lastLoginAt)}</span>}
                </div>
              </div>
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.createdAt', { defaultValue: 'Vytvořeno' })}</div>
                {loading ? <Skeleton className="h-4 w-28" /> : <div>{safeDate((data as any)?.createdAt)}</div>}
              </div>
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.updatedAt', { defaultValue: 'Upraveno' })}</div>
                {loading ? <Skeleton className="h-4 w-28" /> : <div>{safeDate((data as any)?.updatedAt)}</div>}
              </div>
            </div>
          </div>

          {/* Adresy (placeholder – trvalá / doručovací) */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">{t('detail.address.title', { defaultValue: 'Adresy' })}</div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <div className="mb-1 text-xs opacity-70">{t('detail.address.permanent', { defaultValue: 'Trvalá' })}</div>
                <div className="text-gray-700">—</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="mb-1 text-xs opacity-70">{t('detail.address.shipping', { defaultValue: 'Doručovací' })}</div>
                <div className="text-gray-700">—</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions (duplicitně pro pohodlí uživatele) */}
        {(onEdit || onDelete) && (
          <div className="mt-2 flex justify-end gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                {t('detail.actions.edit', { defaultValue: 'Upravit' })}
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                {t('detail.actions.delete', { defaultValue: 'Smazat' })}
              </Button>
            )}
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
      />
    </DetailDrawer>
  );
}
