import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormDrawer } from "@/components/ui/stavbau-ui/drawer/form-drawer";
import { TeamForm } from './TeamForm';
import {type AnyTeamFormValues } from '../validation/schemas';
import type { UUID } from '../api/types';
import { getMember } from '../api/client';

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
};

export function TeamFormDrawer({ i18nNamespaces, open, mode, companyId, memberId, titleKey, submitting, defaultValues, onClose, onSubmit }: TeamFormDrawerProps) {
  const { t } = useTranslation(i18nNamespaces);
  const title = titleKey ? t(titleKey) : t(memberId ? 'form.title.edit' : 'form.title.create');

  const [prefill, setPrefill] = React.useState<Partial<AnyTeamFormValues> | undefined>(defaultValues);

  // Když máme memberId (edit), dotáhneme plný detail a prefillneme formulář
  React.useEffect(() => {
    if (!open || !memberId) return;
    const ac = new AbortController();
    getMember(companyId, memberId, { signal: ac.signal })
      .then((m) => setPrefill({ email: m.email,
                                firstName: m.firstName  ?? "",
                                lastName: m.lastName  ?? "",
                                phone: m.phone  ?? "",
                                companyRole: (m as any).companyRole ?? (m as any).role ?? null,
                                role: (m as any).companyRole ?? (m as any).role ?? null,
                                sendInvite: false }))
      .catch(() => {})
      .finally(() => {});
    return () => ac.abort();
  }, [open, memberId, companyId]);

  return (

        <FormDrawer
            open={open}
            onClose={onClose}
            title={title}
            mode={mode}
            showFooter={false}
            form={
                <TeamForm
                    mode={mode}
                    i18nNamespaces={i18nNamespaces}
                    defaultValues={prefill ?? defaultValues}
                    submitting={submitting}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                />
            }
        >
        </FormDrawer>
    
  );
}