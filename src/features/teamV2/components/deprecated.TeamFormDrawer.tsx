import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormDrawer } from "@/components/ui/stavbau-ui/drawer/form-drawer";
import { Form } from './Form';
import { type AnyTeamFormValues } from '../validation/schemas';
import type { UUID } from '../api/types';
import { getMember } from '../api/client';
import { useMembersStats } from '../hooks/useMembersStats';

export type TeamFormDrawerProps = {
  i18nNamespaces?: string[];
  open: boolean;
  mode: 'create' | 'edit';
  companyId: UUID;
  memberId?: UUID | null;
  titleKey?: string;
  submitting?: boolean;
  defaultValues?: Partial<AnyTeamFormValues>;
  onClose: () => void;
  onSubmit: (values: AnyTeamFormValues) => void;
  lockCompanyRole?: boolean;
  currentCompanyRole?: string | null;
  lockReasonKey?: string; // i18n klíč, default: 'errors.lastOwner'  
};

export function TeamFormDrawer({ i18nNamespaces, open, mode, companyId, memberId, titleKey, submitting, defaultValues, onClose, onSubmit, lockCompanyRole, currentCompanyRole, lockReasonKey }: TeamFormDrawerProps) {
  const { t } = useTranslation(i18nNamespaces);
  const title = titleKey
    ? t(titleKey)
    : mode === 'edit'
      ? t('form.title.edit')
      : t('form.title.create');

  const [prefill, setPrefill] = React.useState<Partial<AnyTeamFormValues> | undefined>(defaultValues);

  // 1) Odvoď efektivní roli z prop i z prefillu (po fetchi detailu)
  const effectiveCompanyRole = React.useMemo(() => {
    const fromPrefill =
      (prefill as any)?.companyRole ??
      (prefill as any)?.role ??
      null;
    return currentCompanyRole ?? fromPrefill;
  }, [currentCompanyRole, prefill]);

  // 2) Zapínej hook jen když víme, že edituješ OWNERa
  const isEditingOwner = effectiveCompanyRole === 'OWNER';
  const { stats } = useMembersStats(
    open && isEditingOwner ? companyId : null,
    open && isEditingOwner
  );

  // computed lock: buď hard-lock z props (předá stránka), nebo podle stats
  const isLastOwner = (lockCompanyRole ?? false) || (isEditingOwner && (stats?.owners === 1));
  const [localError, setLocalError] = React.useState<string | null>(null);

  const safeOnSubmit = React.useCallback((values: AnyTeamFormValues) => {
    setLocalError(null);
    const newRole = (values.companyRole ?? values.role) as string | undefined;

    if (isLastOwner && newRole && newRole !== 'OWNER') {
      setLocalError(t(lockReasonKey ?? 'errors.lastOwner'));
      return; // ⛔️ blokujeme submit
    }
    onSubmit(values);
  }, [isLastOwner, onSubmit, t, lockReasonKey]);

  // Když máme memberId (edit), dotáhneme plný detail a prefillneme formulář
  React.useEffect(() => {
    if (!open || !memberId) return;
    const ac = new AbortController();
    getMember(companyId, memberId, { signal: ac.signal })
      .then((m) => setPrefill({
        email: m.email,
        firstName: m.firstName ?? "",
        lastName: m.lastName ?? "",
        phone: m.phone ?? "",
        companyRole: (m as any).companyRole ?? (m as any).role ?? null,
        role: (m as any).companyRole ?? (m as any).role ?? null,
        sendInvite: false
      }))
      .catch(() => { })
      .finally(() => { });
    return () => ac.abort();
  }, [open, memberId, companyId]);

React.useEffect(() => {
  if (!open) {
    setPrefill(undefined);   // reset lokálního prefillu
  }
}, [open]);

  return (
<FormDrawer
  open={open}
  onClose={onClose}
  title={title}
  mode={mode}
  showFooter={false}
  form={
    <>
      {/* (volitelné) lokální info/chyba nad formulářem */}
      {localError && (
        <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {localError}
        </div>
      )}

      <Form
        key={`${mode}-${memberId ?? 'new'}`}
        mode={mode}
        i18nNamespaces={i18nNamespaces}
        defaultValues={prefill ?? defaultValues}
        submitting={submitting}
        onSubmit={safeOnSubmit}
        onCancel={onClose}
        lockCompanyRole={isLastOwner}
        lockReasonKey={lockReasonKey}
        resetAfterSubmit={mode === 'create'}
      />
    </>
  }
/>
  );
}