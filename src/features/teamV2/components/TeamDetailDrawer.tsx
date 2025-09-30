import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailDrawer } from '@/components/ui/stavbau-ui/drawer/detail-drawer';
import { Button } from '@/components/ui/stavbau-ui/button';
import { ConfirmModal } from '@/components/ui/stavbau-ui//modal/confirm-modal';
import type { MemberDto, UUID } from '../api/types';
import { getMember } from '../api/client';

export type TeamDetailDrawerProps = {
  open: boolean;
  companyId: UUID;
  i18nNamespaces?: string[];
  memberId: UUID | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: (id: UUID) => Promise<void> | void;
  prefill?: Partial<MemberDto>; // optional quick render before fetch
};

export function TeamDetailDrawer({ open, companyId,i18nNamespaces, memberId, onClose, onEdit, onDelete, prefill }: TeamDetailDrawerProps) {
  const { t } = useTranslation(i18nNamespaces);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<MemberDto | null>(prefill ? (prefill as MemberDto) : null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open || !memberId) return;
    const ac = new AbortController();
    setLoading(true);
    getMember(companyId, memberId, { signal: ac.signal })
      .then(setData)
      .catch(() => setData(prefill ? (prefill as MemberDto) : null))
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

  const fmt = (v?: string | number | Date) => (v ? new Date(v).toLocaleString() : '–');

  return (
    <DetailDrawer open={open} onClose={onClose} title={t('detail.title')}>
      {loading && <div className="p-6">{t('detail.loading')}</div>}
      {!loading && data && (
        <div className="flex flex-col gap-4 p-6">
          <div>
            <div className="text-lg font-semibold">{[data.firstName, data.lastName].filter(Boolean).join(' ') || data.email}</div>
            <div className="text-sm opacity-70">{data.email}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="opacity-70">{t('detail.companyRole')}</div>
              <div>{(data as any).companyRole ?? (data as any).role ?? '–'}</div>
            </div>
            <div>
              <div className="opacity-70">{t('detail.lastLoginAt')}</div>
              <div>{fmt((data as any).lastLoginAt)}</div>
            </div>
            <div>
              <div className="opacity-70">{t('detail.phone')}</div>
              <div>{(data as any).phone ?? '–'}</div>
            </div>            
            <div>
              <div className="opacity-70">{t('detail.createdAt')}</div>
              <div>{fmt(data.createdAt)}</div>
            </div>
            <div>
              <div className="opacity-70">{t('detail.updatedAt')}</div>
              <div>{fmt(data.updatedAt)}</div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                {t('detail.actions.edit')}
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                {t('detail.actions.delete')}
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={t('detail.deleteConfirm.title')}
        description={t('detail.deleteConfirm.desc')}
        confirmLabel={t('detail.deleteConfirm.confirm')}
        cancelLabel={t('detail.deleteConfirm.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </DetailDrawer>
  );
}