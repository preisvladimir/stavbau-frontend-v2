// src/features/projects/components/Detail.tsx
//revize 13.10.2025.12.17
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import EntityHeader from '@/components/ui/stavbau-ui/detail/EntityHeader';
import AddressBlock from '@/components/common/AddressBlock';
import { Button } from '@/components/ui/stavbau-ui/button';

import type { ProjectDto } from '../api/types';

import { ScopeGuard, sc } from '@/rbac';
import type { UUID } from '@/types';
import { toApiProblem } from '@/lib/api/problem';

// --- Globální feedback (toast/inline rozhodování) ---
import { InlineStatus, useFeedback, ConfirmModal } from '@/ui';




export type ProjectDetailProps = {
  i18nNamespaces?: string[];
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onArchive?: (id: UUID) => Promise<void> | void;
  onUnarchive?: (id: UUID) => Promise<void> | void;
  onDelete?: (id: UUID) => Promise<void> | void;

  data?: Partial<ProjectDto> | null;
  loading?: boolean;
  error?: string | null;

  onMutated?: () => void;
};

export default function Detail({
  i18nNamespaces = ['projects', 'common'],
  open,
  onClose,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  data,
  loading,
  error,
  onMutated,
}: ProjectDetailProps) {
  const { t } = useTranslation(i18nNamespaces);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmMode, setConfirmMode] =
    React.useState<'archive' | 'unarchive' | 'delete'>('archive');
  const [busy, setBusy] = React.useState(false);

  const feedback = useFeedback();
  const SCOPE = 'projects.detail';

  // přenést vstupní error do inline statusu (když je otevřeno)
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

  // při zavření šuplíku reset stavu + inline clear
  React.useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
      setBusy(false);
      feedback.clear(SCOPE);
    }
  }, [open, feedback]);

  const textOrDash = (v?: React.ReactNode) => (v == null || v === '' ? '—' : v);
  const safeDate = (v?: string | number | Date): string =>
    v ? new Date(v).toLocaleDateString() : '—';

  const showUnarchive = data?.status === 'ARCHIVED' && !!onUnarchive;
  const showArchive = data?.status !== 'ARCHIVED' && !!onArchive;

  const displayDescription = data?.descriptionLocalized?.trim()
    ? (data?.descriptionLocalized as string)
    : (data?.description ?? '');

  const handleConfirm = async () => {
    if (!data?.id) return;
    const id = data.id as UUID;

    try {
      setBusy(true);

      if (confirmMode === 'archive' && onArchive) {
        await onArchive(id);
        // úspěch bez scope => toast
        feedback.show({
          severity: 'success',
          title: t('detail.toasts.archived.title', { defaultValue: 'Archivováno' }),
          description: data?.name ?? id,
        });
      }

      if (confirmMode === 'unarchive' && onUnarchive) {
        await onUnarchive(id);
        feedback.show({
          severity: 'success',
          title: t('detail.toasts.unarchived.title', { defaultValue: 'Obnoveno z archivu' }),
          description: data?.name ?? id,
        });
      }

      if (confirmMode === 'delete' && onDelete) {
        await onDelete(id);
        feedback.show({
          severity: 'success',
          title: t('detail.toasts.deleted.title', { defaultValue: 'Smazáno' }),
          description: data?.name ?? id,
        });
      }

      setConfirmOpen(false);
      onClose();
      onMutated?.();
    } catch (err) {
      const p = toApiProblem(err);

      // 403 řeší globální guard – jen zavřít confirm
      if (p.status === 403) {
        setConfirmOpen(false);
        return;
      }

      const fallbackTitle =
        confirmMode === 'delete'
          ? t('detail.errors.delete.title', { defaultValue: 'Nelze smazat' })
          : confirmMode === 'archive'
            ? t('detail.errors.archive.title', { defaultValue: 'Nelze archivovat' })
            : t('detail.errors.unarchive.title', { defaultValue: 'Nelze obnovit' });

      // chyba do inline (scope je v detailu)
      feedback.show({
        severity: 'error',
        title: fallbackTitle,
        description: p.detail ?? t('errors.tryAgain', { defaultValue: 'Zkuste to prosím znovu.' }),
        scope: SCOPE,
      });
    } finally {
      setBusy(false);
    }
  };

  const headerActions = (
    <>
      <ScopeGuard anyOf={[sc.projects.update]}>
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={!!loading || busy}
          >
            {t('detail.actions.edit', { defaultValue: 'Upravit' })}
          </Button>
        )}
      </ScopeGuard>
      <ScopeGuard anyOf={[sc.projects.archive]}>
        {showArchive && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setConfirmMode('archive');
              setConfirmOpen(true);
            }}
            disabled={!!loading || busy}
          >
            {t('detail.actions.archive', { defaultValue: 'Archivovat' })}
          </Button>
        )}
        {showUnarchive && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setConfirmMode('unarchive');
              setConfirmOpen(true);
            }}
            disabled={!!loading || busy}
          >
            {t('detail.actions.unarchive', { defaultValue: 'Obnovit' })}
          </Button>
        )}
      </ScopeGuard>
      <ScopeGuard anyOf={[sc.projects.delete]}>
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setConfirmMode('delete');
              setConfirmOpen(true);
            }}
            disabled={!!loading || busy}
          >
            {t('detail.actions.delete', { defaultValue: 'Smazat' })}
          </Button>
        )}
      </ScopeGuard>
    </>
  );

  if (!loading && !data && error) {
    return (
      <DetailDrawer
        open={open}
        onClose={onClose}
        title={t('detail.title', { defaultValue: 'Detail projektu' })}
        headerRight={headerActions}
      >
        <div className="p-6">
          {/* i v chybovém fallbacku můžeme zobrazit InlineStatus (scope zachováme stejný) */}
          <InlineStatus scope={SCOPE} />
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-sm font-medium text-red-800">
              {t('errors.loadFailed', { defaultValue: 'Detail se nepodařilo načíst.' })}
            </div>
            <div className="mt-1 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </DetailDrawer>
    );
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={t('detail.title', { defaultValue: 'Detail projektu' })}
      headerRight={headerActions}
    >
      <div className="flex flex-col gap-4 p-6">

        {/* ✅ Globální inline status pro detail projektu */}
        <InlineStatus scope={SCOPE} />

        <EntityHeader
          loading={!!loading}
          title={data?.name ?? ''}
          titleLocalized={(data as any)?.nameLocalized ?? ''}
          code={data?.code ?? undefined}
          badges={[
            data?.status || data?.statusLabel
              ? {
                label: data?.statusLabel ?? data?.status ?? '—',
                tone:
                  data?.status === 'IN_PROGRESS'
                    ? 'success'
                    : data?.status === 'PLANNED'
                      ? 'info'
                      : data?.status === 'ON_HOLD'
                        ? 'warning'
                        : data?.status === 'ARCHIVED'
                          ? 'muted'
                          : 'neutral',
              }
              : undefined,
          ].filter(Boolean) as any}
          meta={[
            {
              label: t('detail.customer', { defaultValue: 'Zákazník' }),
              value: data?.customerName || data?.customerId,
            },
            {
              label: t('detail.projectManager', { defaultValue: 'Projektový manažer' }),
              value: data?.projectManagerName || data?.projectManagerId,
            },
          ]}
          metaLayout="stack"
          avatar={{ initialsFrom: data?.name || data?.code || 'P' }}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Harmonogram */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.schedule.title', { defaultValue: 'Harmonogram' })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field
                label={t('detail.plannedStartDate', { defaultValue: 'Plán. začátek' })}
                value={loading ? null : safeDate(data?.plannedStartDate)}
              />
              <Field
                label={t('detail.plannedEndDate', { defaultValue: 'Plán. konec' })}
                value={loading ? null : safeDate(data?.plannedEndDate)}
              />
              <Field
                label={t('detail.actualStartDate', { defaultValue: 'Skut. začátek' })}
                value={loading ? null : safeDate(data?.actualStartDate)}
              />
              <Field
                label={t('detail.actualEndDate', { defaultValue: 'Skut. konec' })}
                value={loading ? null : safeDate(data?.actualEndDate)}
              />
            </div>
          </div>

          {/* Zákazník & PM */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.parties.title', { defaultValue: 'Zákazník & PM' })}
            </div>
            <div className="space-y-2 text-sm">
              <CopyRow
                loading={!!loading}
                label={t('detail.customer', { defaultValue: 'Zákazník' })}
                value={data?.customerName || data?.customerId}
              />
              <CopyRow
                loading={!!loading}
                label={t('detail.projectManager', { defaultValue: 'Projektový manažer' })}
                value={data?.projectManagerName || data?.projectManagerId}
              />
            </div>
          </div>

          {/* Adresa stavby */}
          <AddressBlock
            title={t('detail.address.title', { defaultValue: 'Adresa stavby' })}
            address={data?.siteAddress}
            loading={!!loading}
            showSource
            showMapLink
            compact
          />

          {/* Parametry */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.params.title', { defaultValue: 'Parametry' })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field
                label={t('detail.currency', { defaultValue: 'Měna' })}
                value={loading ? null : textOrDash(data?.currency)}
              />
              <Field
                label={t('detail.vatMode', { defaultValue: 'DPH režim' })}
                value={loading ? null : textOrDash(data?.vatMode)}
              />
            </div>
            {!!(data as any)?.tags?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(data as any).tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-50 px-2 py-0.5 text-xs ring-1 ring-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Popis */}
          <div className="rounded-xl border p-4 md:col-span-2">
            <div className="mb-2 text-sm font-medium">
              {t('detail.description', { defaultValue: 'Popis' })}
            </div>
            <div className="text-sm text-gray-700">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 w-full max-w-[520px] animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full max-w-[460px] animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full max-w-[380px] animate-pulse rounded bg-gray-200" />
                </div>
              ) : displayDescription ? (
                <p className="whitespace-pre-wrap">{displayDescription}</p>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        {(onEdit || onArchive || onUnarchive || onDelete) && (
          <div className="mt-2 flex justify-end gap-2">
            <ScopeGuard anyOf={[sc.projects.update]}>
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={onEdit}
                  disabled={!!loading || busy}
                >
                  {t('detail.actions.edit', { defaultValue: 'Upravit' })}
                </Button>
              )}
            </ScopeGuard>
            <ScopeGuard anyOf={[sc.projects.archive]}>
              {showArchive && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmMode('archive');
                    setConfirmOpen(true);
                  }}
                  disabled={!!loading || busy}
                >
                  {t('detail.actions.archive', { defaultValue: 'Archivovat' })}
                </Button>
              )}
              {showUnarchive && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmMode('unarchive');
                    setConfirmOpen(true);
                  }}
                  disabled={!!loading || busy}
                >
                  {t('detail.actions.unarchive', { defaultValue: 'Obnovit' })}
                </Button>
              )}
            </ScopeGuard>
            <ScopeGuard anyOf={[sc.projects.delete]}>
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setConfirmMode('delete');
                    setConfirmOpen(true);
                  }}
                  disabled={!!loading || busy}
                >
                  {t('detail.actions.delete', { defaultValue: 'Smazat' })}
                </Button>
              )}
            </ScopeGuard>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={
          confirmMode === 'archive'
            ? t('detail.archiveConfirm.title', { defaultValue: 'Archivovat projekt?' })
            : confirmMode === 'unarchive'
              ? t('detail.unarchiveConfirm.title', { defaultValue: 'Obnovit projekt?' })
              : t('detail.deleteConfirm.title', { defaultValue: 'Smazat projekt?' })
        }
        description={
          confirmMode === 'archive'
            ? t('detail.archiveConfirm.desc', { defaultValue: 'Projekt bude skryt z hlavního výpisu.' })
            : confirmMode === 'unarchive'
              ? t('detail.unarchiveConfirm.desc', { defaultValue: 'Projekt bude opět viditelný v hlavním výpisu.' })
              : t('detail.deleteConfirm.desc', { defaultValue: 'Tato akce je nevratná.' })
        }
        confirmLabel={
          confirmMode === 'archive'
            ? t('detail.archiveConfirm.confirm', { defaultValue: 'Archivovat' })
            : confirmMode === 'unarchive'
              ? t('detail.unarchiveConfirm.confirm', { defaultValue: 'Obnovit' })
              : t('detail.deleteConfirm.confirm', { defaultValue: 'Smazat' })
        }
        cancelLabel={t('detail.deleteConfirm.cancel', { defaultValue: 'Zrušit' })}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
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

function CopyRow({
  loading,
  label,
  value,
}: {
  loading: boolean;
  label: React.ReactNode;
  value?: string | null;
}) {
  const dash = '—';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="opacity-70">{label}</span>
      <div className="flex items-center gap-2">
        {loading ? (
          <span className="inline-block h-4 w-28 animate-pulse rounded bg-gray-200" />
        ) : (
          <span className="max-w-[220px] truncate font-medium" title={value ?? dash}>
            {value ?? dash}
          </span>
        )}
        {!loading && value && (
          <button
            type="button"
            className="text-xs underline decoration-gray-300 underline-offset-2 hover:opacity-80"
            onClick={() => navigator.clipboard?.writeText(value)}
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}
