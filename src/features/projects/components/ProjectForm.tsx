// src/features/projects/components/ProjectForm.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/stavbau-ui/button';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  type AnyProjectFormValues,
} from '../validation/schemas';

export type ProjectFormProps = {
  mode: 'create' | 'edit';
  i18nNamespaces?: string[];
  defaultValues?: Partial<AnyProjectFormValues>;
  submitting?: boolean;
  onSubmit: (values: AnyProjectFormValues) => Promise<void> | void;
  onCancel: () => void;
  /** Po úspěšném submitu vyresetovat formulář (default: true pro create, false pro edit) */
  resetAfterSubmit?: boolean;
};

export function ProjectForm({
  mode,
  i18nNamespaces,
  defaultValues,
  submitting,
  onSubmit,
  onCancel,
  resetAfterSubmit,
}: ProjectFormProps) {
  const { t } = useTranslation(i18nNamespaces ?? ['projects', 'common']);

  const schema = mode === 'create' ? CreateProjectSchema : UpdateProjectSchema;
  const shouldReset = resetAfterSubmit ?? (mode === 'create');

  // jednotné výchozí hodnoty – použijeme je i při resetu po submitu
  const defaultValuesResolved = React.useMemo<AnyProjectFormValues>(
    () => ({
      name: '',
      code: '',
      description: '',
      customerId: '',
      projectManagerId: '',
      plannedStartDate: '',
      plannedEndDate: '',
      currency: '',
      vatMode: '',
      ...(defaultValues as Partial<AnyProjectFormValues>),
    }),
    [defaultValues]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AnyProjectFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<AnyProjectFormValues>,
    defaultValues: defaultValuesResolved,
  });

  // přenastavení zvenčí (změna defaultValues)
  React.useEffect(() => {
    reset(defaultValuesResolved);
  }, [defaultValuesResolved, reset]);

  const onSubmitInternal = React.useCallback(
    async (vals: AnyProjectFormValues) => {
      await onSubmit(vals);
      if (shouldReset) {
        reset(defaultValuesResolved);
      }
    },
    [onSubmit, shouldReset, reset, defaultValuesResolved]
  );

  const disabled = submitting || isSubmitting;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitInternal)} noValidate>
      {/* Name */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.name.label', { defaultValue: 'Název' })}</span>
        <input
          className="rounded-md border px-3 py-2"
          autoComplete="off"
          disabled={disabled}
          {...register('name')}
        />
        {errors.name && (
          <span className="text-xs text-red-600">
            {t(errors.name.message as string, { defaultValue: t('form.name.error', { defaultValue: 'Zadejte název' }) as string })}
          </span>
        )}
      </label>

      {/* Code */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.code.label', { defaultValue: 'Kód' })}</span>
        <input className="rounded-md border px-3 py-2" autoComplete="off" disabled={disabled} {...register('code')} />
        {errors.code && <span className="text-xs text-red-600">{t(errors.code.message as string)}</span>}
      </label>

      {/* Customer & PM */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.customer.label', { defaultValue: 'Zákazník' })}</span>
          <input
            className="rounded-md border px-3 py-2"
            autoComplete="off"
            disabled={disabled}
            {...register('customerId', {
              setValueAs: (v) => (v === '' ? '' : String(v)),
            })}
          />
          {errors.customerId && (
            <span className="text-xs text-red-600">
              {t(errors.customerId.message as string, { defaultValue: t('form.customer.error', { defaultValue: 'Vyberte zákazníka' }) as string })}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.projectManager.label', { defaultValue: 'Projektový manažer' })}</span>
          <input
            className="rounded-md border px-3 py-2"
            autoComplete="off"
            disabled={disabled}
            {...register('projectManagerId', {
              setValueAs: (v) => (v === '' ? '' : String(v)),
            })}
          />
          {errors.projectManagerId && (
            <span className="text-xs text-red-600">{t(errors.projectManagerId.message as string)}</span>
          )}
        </label>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.plannedStartDate.label', { defaultValue: 'Plán. začátek' })}</span>
          <input type="date" className="rounded-md border px-3 py-2" disabled={disabled} {...register('plannedStartDate')} />
          {errors.plannedStartDate && (
            <span className="text-xs text-red-600">{t(errors.plannedStartDate.message as string)}</span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.plannedEndDate.label', { defaultValue: 'Plán. konec' })}</span>
          <input type="date" className="rounded-md border px-3 py-2" disabled={disabled} {...register('plannedEndDate')} />
          {errors.plannedEndDate && (
            <span className="text-xs text-red-600">{t(errors.plannedEndDate.message as string)}</span>
          )}
        </label>
      </div>

      {/* Description */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.description.label', { defaultValue: 'Popis' })}</span>
        <textarea className="rounded-md border px-3 py-2" rows={4} disabled={disabled} {...register('description')} />
        {errors.description && (
          <span className="text-xs text-red-600">{t(errors.description.message as string)}</span>
        )}
      </label>

      {/* Currency & VAT mode */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.currency.label', { defaultValue: 'Měna' })}</span>
          <input className="rounded-md border px-3 py-2" disabled={disabled} {...register('currency')} />
          {errors.currency && (
            <span className="text-xs text-red-600">{t(errors.currency.message as string)}</span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.vatMode.label', { defaultValue: 'DPH režim' })}</span>
          <input className="rounded-md border px-3 py-2" disabled={disabled} {...register('vatMode')} />
          {errors.vatMode && (
            <span className="text-xs text-red-600">{t(errors.vatMode.message as string)}</span>
          )}
        </label>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
          {t('form.actions.cancel', { defaultValue: 'Zrušit' })}
        </Button>
        <Button type="submit" variant="primary" disabled={disabled}>
          {t('form.actions.submit', { defaultValue: 'Uložit' })}
        </Button>
      </div>
    </form>
  );
}

export default ProjectForm;
