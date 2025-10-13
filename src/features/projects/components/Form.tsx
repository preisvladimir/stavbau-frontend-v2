// src/features/projects/components/Form.tsx  (nebo .../ProjectForm.tsx podle tvé struktury)
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import AsyncSearchSelect from '@/components/ui/stavbau-ui/AsyncSearchSelect';
import { useRequiredCompanyId } from "@/features/auth/hooks/useCompanyId";
import { AddressAutocomplete } from '@/components/ui/stavbau-ui/addressautocomplete';

import type { AddressSuggestion } from '@/lib/api/geo';

import type { ExtendFormProps } from '@/components/ui/stavbau-ui/forms/types';
import type { FetchOptions } from '@/components/ui/stavbau-ui/AsyncSearchSelect';
import { customersService } from '@/features/customers/api/customers-service';
import { teamService } from '@/features/teamV2/api/team-service';

import {
  CreateProjectSchema,
  UpdateProjectSchema,
  type AnyProjectFormValues,
} from '../validation/schemas';

import { toApiProblem } from "@/lib/api/problem";
import { applyApiErrorsToForm } from "@/lib/forms/applyApiErrorsToForm";


import type { UUID, AddressDto } from '@/types';
// --- Globální feedback (toast/inline rozhodování) + UI Components ---
import {Button, InlineStatus, useFeedback } from '@/ui';

export type ProjectFormProps = {
  companyId: UUID;
  mode: 'create' | 'edit';
  i18nNamespaces?: string[];
  defaultValues?: Partial<AnyProjectFormValues>;
  submitting?: boolean;
  onSubmit: (values: AnyProjectFormValues) => Promise<void> | void;
  onCancel: () => void;
  /** Po úspěšném submitu vyresetovat formulář (default: true pro create, false pro edit) */
  resetAfterSubmit?: boolean;
};

type ProjectSpecificProps = {
  companyId?: UUID;
  serverError?: string | null;
};

export type FormProps = ExtendFormProps<AnyProjectFormValues, 'create' | 'edit', ProjectSpecificProps>;

export function Form({
  mode,
  i18nNamespaces,
  defaultValues,
  submitting,
  onSubmit,
  onCancel,
  resetAfterSubmit,
  serverError,
  //loading = false, // ponecháno kvůli signatuře; nezobrazujeme s ním chyby
  onClear,
  onDirtyChange,
  autoFocus = true,
}: FormProps) {

  const { t } = useTranslation(i18nNamespaces ?? ['projects', 'common']);
  const companyId = useRequiredCompanyId();
  const schema = mode === 'create' ? CreateProjectSchema : UpdateProjectSchema;
  const shouldReset = resetAfterSubmit ?? (mode === 'create');

  const customers = React.useMemo(() => customersService(companyId), [companyId]);
  const team = React.useMemo(() => teamService(companyId), [companyId]);

  const fetchCustomers: FetchOptions = ({ q, page, size, signal }) =>
    customers.pagedLookupFetcher()(q ?? '', page ?? 0, size ?? 10, signal);

  const fetchPMs: FetchOptions = ({ q, page, size, signal }) =>
    team.pagedLookupFetcher()(q ?? '', page ?? 0, size ?? 10, signal);

  // ✅ globální feedback
  const feedback = useFeedback();
  const STATUS_SCOPE = 'projects.form';

  // Pokud přijde serverError od rodiče, pošli jej do inline statusu pro tento scope
  React.useEffect(() => {
    if (!serverError) return;
    feedback.show({
      severity: 'error',
      title: t('detail.errors.generic', { defaultValue: 'Došlo k chybě' }),
      description: serverError,
      scope: STATUS_SCOPE,
    });
  }, [serverError, feedback, t]);

  // výchozí hodnoty (použité i při resetu po submitu)
  const defaultValuesResolved = React.useMemo<AnyProjectFormValues>(
    () => ({
      name: '',
      description: '',
      customerId: '',
      projectManagerId: '',
      plannedStartDate: '',
      plannedEndDate: '',
      currency: '',
      vatMode: '',
      siteAddress: undefined,
      ...(defaultValues as Partial<AnyProjectFormValues>),
    }),
    [defaultValues]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
    watch,
    setError,
    setFocus,
  } = useForm<AnyProjectFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<AnyProjectFormValues>,
    defaultValues: defaultValuesResolved,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  // přenastavení zvenčí (změna defaultValues)
  React.useEffect(() => {
    reset(defaultValuesResolved, { keepDirty: false });
  }, [defaultValuesResolved, reset]);

  // hlášení dirty změn rodiči
  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // autofocus: první chyba, jinak v create -> name
  React.useEffect(() => {
    if (!autoFocus) return;
    const keys = Object.keys(errors);
    if (keys.length > 0) {
      setFocus(keys[0] as any);
      return;
    }
    if (mode === 'create') setFocus('name');
  }, [errors, autoFocus, mode, setFocus]);

  const onSubmitInternal = React.useCallback(
    async (vals: AnyProjectFormValues) => {
      try {
        await onSubmit(vals);
        if (shouldReset) {
          reset(defaultValuesResolved, { keepDirty: false });
        }
      } catch (err) {
        const p = toApiProblem(err);

        // 422 → mapuj field chyby do RHF (bez toastu)
        if (p.status === 422 && p.errors) {
          const { applied, unknown } = applyApiErrorsToForm<AnyProjectFormValues>(p, setError);

          // fokus na první chybné pole
          const first = Object.keys(p.errors ?? {})[0];
          if (first) setFocus(first as any);

          // fallback, pokud BE nedodal konkrétní field chyby
          if (!applied && (p.detail || unknown)) {
            feedback.show({
              severity: 'error',
              title: t('validation.failed', { defaultValue: 'Neplatná data' }),
              description: p.detail || unknown,
              scope: STATUS_SCOPE,
            });
          }
          return;
        }

        // 409 – konflikt
        if (p.status === 409) {
          feedback.show({
            severity: 'warning',
            title: t('errors.conflict.title', { defaultValue: 'Konflikt' }),
            description: p.detail ?? t('errors.conflict.desc', { defaultValue: 'Záznam byl mezitím změněn.' }),
            scope: STATUS_SCOPE,
          });
          return;
        }

        // 403 – většinou řeší globální guard; fallback inline
        if (p.status === 403) {
          feedback.show({
            severity: 'error',
            title: t('errors.forbidden', { defaultValue: 'Přístup zamítnut' }),
            description: p.detail ?? t('errors.rbac.forbidden', { defaultValue: 'Nemáte oprávnění provést tuto akci.' }),
            scope: STATUS_SCOPE,
          });
          return;
        }

        // 400/404/5xx – obecný fallback
        feedback.show({
          severity: 'error',
          title: t('errors.generic', { defaultValue: 'Chyba' }),
          description: p.detail ?? t('errors.tryAgain', { defaultValue: 'Nepodařilo se uložit. Zkuste to prosím znovu.' }),
          scope: STATUS_SCOPE,
        });
      }
    },
    [onSubmit, shouldReset, reset, defaultValuesResolved, setError, setFocus, feedback, t]
  );

  const disabled = submitting || isSubmitting;

  const initialCustomerLabel = (defaultValues as any)?.customerLabel as string | undefined;
  const initialPmLabel = (defaultValues as any)?.projectManagerLabel as string | undefined;

  // RHF hodnoty → AsyncSearchSelect (null = nevybráno)
  const customerIdValue = watch('customerId') || '';
  const pmIdValue = watch('projectManagerId') || '';

  // GEO → AddressDto pro siteAddress
  const onSiteAddressPick = React.useCallback((addr: AddressSuggestion) => {
    const nn = <T,>(v: T | null | undefined) => (v ?? undefined);
    const dto: AddressDto = {
      formatted: nn(addr.formatted),
      street: nn(addr.street),
      houseNumber: nn(addr.houseNumber),
      orientationNumber: nn((addr as any).orientationNumber ?? addr.houseNumber),
      city: nn(addr.municipality),
      cityPart: nn(addr.municipalityPart),
      postalCode: nn(addr.zip),
      countryCode: nn(addr.countryIsoCode) ?? 'CZ',
      latitude: nn(addr.lat),
      longitude: nn(addr.lon),
      source: 'GEO',
    };
    setValue('siteAddress', dto, { shouldDirty: true, shouldValidate: false });
  }, [setValue]);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitInternal)} noValidate>
      {/* ✅ Globální inline status pro tento formulář; schová se přes onClear z rodiče */}
      <InlineStatus scope={STATUS_SCOPE} onClear={onClear} />

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
            {t(errors.name.message as string, {
              defaultValue: t('form.name.error', { defaultValue: 'Zadejte název' }) as string,
            })}
          </span>
        )}
      </label>

      {/* Customer & PM */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Customer */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.customer.label', { defaultValue: 'Zákazník' })}</span>
          <AsyncSearchSelect
            value={customerIdValue || null}
            valueLabel={initialCustomerLabel}
            onChange={(val) => setValue('customerId', val ?? '')}
            fetchOptions={fetchCustomers}
            pageSize={10}
            minChars={1}
            labels={{
              placeholder: t('form.customer.placeholder', { defaultValue: 'Vyhledej zákazníka…' }),
              loadMore: t('common.loadMore', { defaultValue: 'Načíst další' }),
              clear: t('common.clear', { defaultValue: 'Vymazat výběr' }),
            }}
          />
          {/* skryté RHF pole pro zod/schema */}
          <input type="hidden" {...register('customerId', { setValueAs: (v) => (v === '' ? '' : String(v)) })} />
          {errors.customerId && (
            <span className="text-xs text-red-600">
              {t(errors.customerId.message as string, {
                defaultValue: t('form.customer.error', { defaultValue: 'Vyberte zákazníka' }) as string,
              })}
            </span>
          )}
        </label>

        {/* Project Manager */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.projectManager.label', { defaultValue: 'Projektový manažer' })}</span>
          <AsyncSearchSelect
            value={pmIdValue || null}
            valueLabel={initialPmLabel}
            onChange={(val) => setValue('projectManagerId', val ?? '')}
            fetchOptions={fetchPMs}
            pageSize={10}
            minChars={1}
            labels={{
              placeholder: t('form.team.placeholder', { defaultValue: 'Vyhledej zaměstnance…' }),
              loadMore: t('common.loadMore', { defaultValue: 'Načíst další' }),
              clear: t('common.clear', { defaultValue: 'Vymazat výběr' }),
            }}
          />
          <input
            type="hidden"
            {...register('projectManagerId', { setValueAs: (v) => (v === '' ? '' : String(v)) })}
          />
          {errors.projectManagerId && (
            <span className="text-xs text-red-600">{t(errors.projectManagerId.message as string)}</span>
          )}
        </label>
      </div>

      {/* Adresa stavby (siteAddress) */}
      <div className="flex flex-col gap-2">
        <span className="text-sm">{t('form.address', { defaultValue: 'Adresa' })}</span>
        <AddressAutocomplete onSelect={onSiteAddressPick} />
        <input
          className="rounded-md border px-3 py-2"
          placeholder={t('form.addressFormatted', { defaultValue: 'Adresa (formatted)' }) as string}
          disabled={disabled}
          {...register('siteAddress.formatted')}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            className="rounded-md border px-3 py-2"
            placeholder={t('form.street', { defaultValue: 'Ulice' }) as string}
            disabled={disabled}
            {...register('siteAddress.street')}
          />
          <input
            className="rounded-md border px-3 py-2"
            placeholder={t('form.houseNumber', { defaultValue: 'Číslo popisné' }) as string}
            disabled={disabled}
            {...register('siteAddress.houseNumber')}
          />
          <input
            className="rounded-md border px-3 py-2"
            placeholder={t('form.orientationNumber', { defaultValue: 'Číslo orientační' }) as string}
            disabled={disabled}
            {...register('siteAddress.orientationNumber')}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            className="rounded-md border px-3 py-2"
            placeholder={t('form.city', { defaultValue: 'Město' }) as string}
            disabled={disabled}
            {...register('siteAddress.city')}
          />
          <input
            className="rounded-md border px-3 py-2"
            placeholder={t('form.postalCode', { defaultValue: 'PSČ' }) as string}
            disabled={disabled}
            {...register('siteAddress.postalCode')}
          />
          <input
            className="rounded-md border px-3 py-2"
            placeholder={t('form.countryCode', { defaultValue: 'Země (ISO2)' }) as string}
            disabled={disabled}
            {...register('siteAddress.countryCode')}
          />
        </div>
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
          {errors.currency && <span className="text-xs text-red-600">{t(errors.currency.message as string)}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.vatMode.label', { defaultValue: 'DPH režim' })}</span>
          <input className="rounded-md border px-3 py-2" disabled={disabled} {...register('vatMode')} />
          {errors.vatMode && <span className="text-xs text-red-600">{t(errors.vatMode.message as string)}</span>}
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

export default Form;
