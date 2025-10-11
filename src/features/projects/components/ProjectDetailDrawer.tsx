// src/features/projects/components/ProjectDetailDrawer.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import ProjectDetailHeader from './ProjectDetailHeader';
import AddressBlock from '@/components/common/AddressBlock';
import { Button } from '@/components/ui/stavbau-ui/button';
import { ConfirmModal } from '@/components/ui/stavbau-ui/modal/confirm-modal';
import type { ProjectDto, UUID } from '../api/types';
import { getProject } from '../api/client';
import ScopeGuard from '@/features/auth/guards/ScopeGuard';
import { PROJECT_SCOPES } from '@/features/projects/const/scopes';

export type ProjectDetailDrawerProps = {
  open: boolean;
  companyId: UUID;
  projectId: UUID | null;
  onClose: () => void;
  onEdit?: () => void;
  onArchive?: (id: UUID) => Promise<void> | void;
  onUnarchive?: (id: UUID) => Promise<void> | void;
  onDelete?: (id: UUID) => Promise<void> | void;
  prefill?: Partial<ProjectDto>;
  i18nNamespaces?: string[];
};

export function ProjectDetailDrawer({
  open,
  companyId,
  projectId,
  onClose,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  prefill,
  i18nNamespaces = ['projects', 'common'],
}: ProjectDetailDrawerProps) {
  const { t } = useTranslation(i18nNamespaces);

  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<ProjectDto | null>(
    prefill ? (prefill as ProjectDto) : null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmMode, setConfirmMode] = React.useState<'archive' | 'unarchive' | 'delete'>('archive');

  // ---- fetch detail ----
  const fetchDetail = React.useCallback(
    (signal?: AbortSignal) =>
      getProject(companyId, projectId as UUID, { signal })
        .then((d) => setData(d))
        .catch((e: any) => {
          setError(e?.response?.data?.detail || e?.message || 'Failed to load');
          // prefill může zůstat jako last-known
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        }),
    [companyId, projectId]
  );

  React.useEffect(() => {
    if (!open || !projectId) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    void fetchDetail(ac.signal);
    return () => ac.abort();
  }, [open, projectId, fetchDetail]);

  // ---- helpers ----
  const textOrDash = (v?: React.ReactNode) => (v == null || v === '' ? '—' : v);

  const safeDate = (v?: string | number | Date): string =>
    v ? new Date(v).toLocaleDateString?.() || String(v) : '—';


  const showUnarchive = data?.status === 'ARCHIVED' && !!onUnarchive;
  const showArchive = data?.status !== 'ARCHIVED' && !!onArchive;

  const displayDescription = data?.descriptionLocalized?.trim()
    ? (data?.descriptionLocalized as string)
    : (data?.description ?? '');

  // ---- actions ----
  const handleConfirm = async () => {
    if (!data?.id) return;
    if (confirmMode === 'archive' && onArchive) await onArchive(data.id as UUID);
    if (confirmMode === 'unarchive' && onUnarchive) await onUnarchive(data.id as UUID);
    if (confirmMode === 'delete' && onDelete) await onDelete(data.id as UUID);
    setConfirmOpen(false);
    onClose();
  };

  const headerActions = (
    <>
      <ScopeGuard anyOf={[PROJECT_SCOPES.UPDATE]}>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} disabled={loading}>
            {t('detail.actions.edit', { defaultValue: 'Upravit' })}
          </Button>
        )}
      </ScopeGuard>
      <ScopeGuard anyOf={[PROJECT_SCOPES.ARCHIVE]}>
        {showArchive && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setConfirmMode('archive');
              setConfirmOpen(true);
            }}
            disabled={loading}
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
            disabled={loading}
          >
            {t('detail.actions.unarchive', { defaultValue: 'Obnovit' })}
          </Button>
        )}
      </ScopeGuard>
      <ScopeGuard anyOf={[PROJECT_SCOPES.DELETE]}>
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setConfirmMode('delete');
              setConfirmOpen(true);
            }}
            disabled={loading}
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
      title={t('detail.title', { defaultValue: 'Detail projektu' })}
      headerRight={headerActions}
    >
      {/* Error banner + Retry */}
      {!loading && error && (
        <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3">
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
        {/* Header panel */}
        <ProjectDetailHeader
          loading={loading}
          name={data?.name}
          nameLocalized={(data as any)?.nameLocalized}
          code={data?.code}
          status={data?.status}
          statusLabel={data?.statusLabel}
        />
        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Harmonogram */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.schedule.title', { defaultValue: 'Harmonogram' })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label={t('detail.plannedStartDate', { defaultValue: 'Plán. začátek' })} value={loading ? null : safeDate(data?.plannedStartDate)} />
              <Field label={t('detail.plannedEndDate', { defaultValue: 'Plán. konec' })} value={loading ? null : safeDate(data?.plannedEndDate)} />
              <Field label={t('detail.actualStartDate', { defaultValue: 'Skut. začátek' })} value={loading ? null : safeDate(data?.actualStartDate)} />
              <Field label={t('detail.actualEndDate', { defaultValue: 'Skut. konec' })} value={loading ? null : safeDate(data?.actualEndDate)} />
            </div>
          </div>

          {/* Zákazník & PM */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.parties.title', { defaultValue: 'Zákazník & PM' })}
            </div>
            <div className="space-y-2 text-sm">
              <CopyRow
                loading={loading}
                label={t('detail.customer', { defaultValue: 'Zákazník' })}
                value={data?.customerName || data?.customerId}
              />
              <CopyRow
                loading={loading}
                label={t('detail.projectManager', { defaultValue: 'Projektový manažer' })}
                value={data?.projectManagerName || data?.projectManagerId}
              />
            </div>
          </div>

          {/* Adresa stavby */}
                <AddressBlock
                  title={t('detail.address.title', { defaultValue: 'Adresa stavby' })}
                  address={data?.siteAddress}
                  loading={loading}
                  showSource
                  showMapLink
                  compact
                />
          

          {/* Finance / parametry */}
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-sm font-medium">
              {t('detail.params.title', { defaultValue: 'Parametry' })}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label={t('detail.currency', { defaultValue: 'Měna' })} value={loading ? null : textOrDash(data?.currency)} />
              <Field label={t('detail.vatMode', { defaultValue: 'DPH režim' })} value={loading ? null : textOrDash(data?.vatMode)} />
            </div>
            {!!(data as any)?.tags?.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(data as any).tags.map((tag: string) => (
                  <span key={tag} className="rounded-full bg-gray-50 px-2 py-0.5 text-xs ring-1 ring-gray-200">
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

        {/* Footer actions */}
        {(onEdit || onArchive || onUnarchive || onDelete) && (
          <div className="mt-2 flex justify-end gap-2">
            <ScopeGuard anyOf={[PROJECT_SCOPES.UPDATE]}>
              {onEdit && (
                <Button variant="outline" onClick={onEdit} disabled={loading}>
                  {t('detail.actions.edit', { defaultValue: 'Upravit' })}
                </Button>
              )}
            </ScopeGuard>
            <ScopeGuard anyOf={[PROJECT_SCOPES.ARCHIVE]}>
              {showArchive && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmMode('archive');
                    setConfirmOpen(true);
                  }}
                  disabled={loading}
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
                  disabled={loading}
                >
                  {t('detail.actions.unarchive', { defaultValue: 'Obnovit' })}
                </Button>
              )}
            </ScopeGuard>
            <ScopeGuard anyOf={[PROJECT_SCOPES.DELETE]}>
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setConfirmMode('delete');
                    setConfirmOpen(true);
                  }}
                  disabled={loading}
                >
                  {t('detail.actions.delete', { defaultValue: 'Smazat' })}
                </Button>
              )}
            </ScopeGuard>
          </div>
        )}
      </div>

      {/* Confirm (Archive/Unarchive/Delete) */}
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
          <span className="font-medium truncate max-w-[220px]" title={value ?? dash}>
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

export default ProjectDetailDrawer;
