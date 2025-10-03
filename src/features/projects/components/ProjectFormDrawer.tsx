// src/features/projects/components/ProjectFormDrawer.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormDrawer } from '@/components/ui/stavbau-ui/drawer/form-drawer';
import ProjectForm from './ProjectForm';
import type { AnyProjectFormValues } from '../validation/schemas';
import type { UUID } from '../api/types';
import { getProject } from '../api/client';

export type ProjectFormDrawerProps = {
  i18nNamespaces?: string[];
  open: boolean;
  mode: 'create' | 'edit';
  projectId?: UUID | null;
  titleKey?: string;
  submitting?: boolean;
  defaultValues?: Partial<AnyProjectFormValues>;
  onClose: () => void;
  onSubmit: (values: AnyProjectFormValues) => void | Promise<void>;
};

export function ProjectFormDrawer({
  i18nNamespaces = ['projects', 'common'],
  open,
  mode,
  projectId,
  titleKey,
  submitting,
  defaultValues,
  onClose,
  onSubmit,
}: ProjectFormDrawerProps) {
  const { t } = useTranslation(i18nNamespaces);
  const title = titleKey
    ? t(titleKey)
    : mode === 'edit'
    ? t('form.title.edit', { defaultValue: 'Upravit projekt' })
    : t('form.title.create', { defaultValue: 'Nový projekt' });

  const [prefill, setPrefill] = React.useState<Partial<AnyProjectFormValues> | undefined>(defaultValues);
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Když máme projectId (edit), dotáhneme detail a prefillneme formulář
  React.useEffect(() => {
    if (!open || !projectId) return;
    const ac = new AbortController();
    getProject(projectId)
      .then((p) =>
        setPrefill({
          name: p.name ?? '',
          code: p.code ?? '',
          description: p.description ?? '',
          customerId: p.customerId ?? '',
          projectManagerId: p.projectManagerId ?? '',
          plannedStartDate: p.plannedStartDate ?? '',
          plannedEndDate: p.plannedEndDate ?? '',
          currency: p.currency ?? '',
          vatMode: p.vatMode ?? '',
        })
      )
      .catch((e: any) => {
        // decentní hláška, formulář ponecháme s původními defaultValues
        setLocalError(e?.response?.data?.detail || e?.message || 'Failed to load');
      });
    return () => ac.abort();
  }, [open, projectId]);

  // Po zavření resetuj lokální prefill (a chybovou hlášku)
  React.useEffect(() => {
    if (!open) {
      setPrefill(undefined);
      setLocalError(null);
    }
  }, [open]);

  const safeOnSubmit = React.useCallback(
    (values: AnyProjectFormValues) => {
      setLocalError(null);
      onSubmit(values);
    },
    [onSubmit]
  );

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

          <ProjectForm
            key={`${mode}-${projectId ?? 'new'}`}
            mode={mode}
            i18nNamespaces={i18nNamespaces}
            defaultValues={prefill ?? defaultValues}
            submitting={submitting}
            onSubmit={safeOnSubmit}
            onCancel={onClose}
            resetAfterSubmit={mode === 'create'}
          />
        </>
      }
    />
  );
}

export default ProjectFormDrawer;
