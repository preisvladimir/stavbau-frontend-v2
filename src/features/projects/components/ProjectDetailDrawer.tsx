// src/features/projects/components/ProjectDetailDrawer.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import { Button } from '@/components/ui/stavbau-ui/button';
import { ConfirmModal } from '@/components/ui/stavbau-ui/modal/confirm-modal';
import type { ProjectDto, UUID } from '../api/types';
import { getProject } from '../api/client';

export type ProjectDetailDrawerProps = {
  open: boolean;
  projectId: UUID | null;
  onClose: () => void;
  onEdit?: () => void;
  /** preferovaná akce (soft delete) */
  onArchive?: (id: UUID) => Promise<void> | void;
  /** volitelně i hard delete */
  onDelete?: (id: UUID) => Promise<void> | void;
  /** Rychlý render před fetchem */
  prefill?: Partial<ProjectDto>;
  /** Vlastní i18n namespace(y) – default: ['projects'] */
  i18nNamespaces?: string[];
};

export function ProjectDetailDrawer({
  open,
  projectId,
  onClose,
  onEdit,
  onArchive,
  onDelete,
  prefill,
  i18nNamespaces = ['projects'],
}: ProjectDetailDrawerProps) {
  const { t } = useTranslation(i18nNamespaces);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<ProjectDto | null>(prefill ? (prefill as ProjectDto) : null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmMode, setConfirmMode] = React.useState<'archive' | 'delete'>('archive');

  React.useEffect(() => {
    if (!open || !projectId) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    getProject(projectId)
      .then((d) => setData(d))
      .catch((e: any) => {
        // fallback na prefill; chybu zobrazíme decentně nahoře
        setData(prefill ? (prefill as ProjectDto) : null);
        setError(e?.response?.data?.detail || e?.message || 'Failed to load');
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  // --- Helpers ---
  const safeDate = (v?: string | number | Date): string =>
    v ? new Date(v).toLocaleDateString?.() || String(v) : '—';

  const initials = (label?: string): string => {
    const src = (label ?? 'P').trim();
    if (!src) return 'P';
    const parts = src.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? src[0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';
    return (first + (last || '')).toUpperCase();
  };

  const statusBadge = (status?: string | null, statusLabel?: string | null) => {
    if (!status && !statusLabel) return null;
    const label = statusLabel ?? status ?? '—';
    const s = status ?? '';
    const className =
      s === 'IN_PROGRESS'
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : s === 'PLANNED'
        ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
        : s === 'ON_HOLD'
        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
        : s === 'DONE'
        ? 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
        : s === 'ARCHIVED'
        ? 'bg-gray-50 text-gray-500 ring-1 ring-gray-200'
        : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200';
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${className}`}>{label}</span>;
  };

  const handleArchive = async () => {
    if (!data?.id || !onArchive) return;
    await onArchive(data.id as UUID);
    setConfirmOpen(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!data?.id || !onDelete) return;
    await onDelete(data.id as UUID);
    setConfirmOpen(false);
    onClose();
  };

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={t('detail.title', { defaultValue: 'Detail projektu' })}
      headerRight={
        <>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              {t('detail.actions.edit', { defaultValue: 'Upravit' })}
            </Button>
          )}
          {onArchive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setConfirmMode('archive');
                setConfirmOpen(true);
              }}
            >
              {t('detail.actions.archive', { defaultValue: 'Archivovat' })}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirmMode('delete');
                setConfirmOpen(true);
              }}
            >
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
              <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200" />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {initials(data?.code || data?.name || 'P')}
              </span>
            )}
          </div>

          {/* Title + primary info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">
                {loading ? <span className="inline-block h-5 w-48 animate-pulse rounded bg-gray-200" /> : (data?.name ?? '—')}
              </h2>
              {!loading && statusBadge(data?.status, data?.statusLabel)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="opacity-70">{t('detail.code', { defaultValue: 'Kód' })}:</span>
              {loading ? (
                <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" />
              ) : (
                <span className="font-medium">{data?.code ?? '—'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Plán & skutečnost */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.schedule.title', { defaultValue: 'Harmonogram' })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.plannedStartDate', { defaultValue: 'Plán. začátek' })}</div>
                <div>{loading ? <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" /> : safeDate(data?.plannedStartDate)}</div>
              </div>
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.plannedEndDate', { defaultValue: 'Plán. konec' })}</div>
                <div>{loading ? <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" /> : safeDate(data?.plannedEndDate)}</div>
              </div>
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.actualStartDate', { defaultValue: 'Skut. začátek' })}</div>
                <div>{loading ? <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" /> : safeDate(data?.actualStartDate)}</div>
              </div>
              <div className="space-y-1">
                <div className="opacity-70">{t('detail.actualEndDate', { defaultValue: 'Skut. konec' })}</div>
                <div>{loading ? <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" /> : safeDate(data?.actualEndDate)}</div>
              </div>
            </div>
          </div>

          {/* Zákazník & PM */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.parties.title', { defaultValue: 'Zákazník & PM' })}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="opacity-70">{t('detail.customer', { defaultValue: 'Zákazník' })}</span>
                <span className="font-medium">{loading ? <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" /> : (data?.customerId ?? '—')}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="opacity-70">{t('detail.projectManager', { defaultValue: 'Projektový manažer' })}</span>
                <span className="font-medium">{loading ? <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" /> : (data?.projectManagerId ?? '—')}</span>
              </div>
            </div>
          </div>

          {/* Popis */}
          <div className="rounded-xl border p-4 md:col-span-2">
            <div className="mb-2 text-sm font-medium">{t('detail.description', { defaultValue: 'Popis' })}</div>
            <div className="text-sm text-gray-700">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 w-full max-w-[520px] animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full max-w-[460px] animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full max-w-[380px] animate-pulse rounded bg-gray-200" />
                </div>
              ) : data?.description ? (
                <p className="whitespace-pre-wrap">{data.description}</p>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        {/* Footer actions (duplicitně pro pohodlí uživatele) */}
        {(onEdit || onArchive || onDelete) && (
          <div className="mt-2 flex justify-end gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                {t('detail.actions.edit', { defaultValue: 'Upravit' })}
              </Button>
            )}
            {onArchive && (
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmMode('archive');
                  setConfirmOpen(true);
                }}
              >
                {t('detail.actions.archive', { defaultValue: 'Archivovat' })}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmMode('delete');
                  setConfirmOpen(true);
                }}
              >
                {t('detail.actions.delete', { defaultValue: 'Smazat' })}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Confirm (Archive/Delete) */}
      <ConfirmModal
        open={confirmOpen}
        title={
          confirmMode === 'archive'
            ? t('detail.archiveConfirm.title', { defaultValue: 'Archivovat projekt?' })
            : t('detail.deleteConfirm.title', { defaultValue: 'Smazat projekt?' })
        }
        description={
          confirmMode === 'archive'
            ? t('detail.archiveConfirm.desc', { defaultValue: 'Projekt bude skryt z hlavního výpisu.' })
            : t('detail.deleteConfirm.desc', { defaultValue: 'Tato akce je nevratná.' })
        }
        confirmLabel={
          confirmMode === 'archive'
            ? t('detail.archiveConfirm.confirm', { defaultValue: 'Archivovat' })
            : t('detail.deleteConfirm.confirm', { defaultValue: 'Smazat' })
        }
        cancelLabel={t('detail.deleteConfirm.cancel', { defaultValue: 'Zrušit' })}
        onConfirm={confirmMode === 'archive' ? handleArchive : handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </DetailDrawer>
  );
}

export default ProjectDetailDrawer;
