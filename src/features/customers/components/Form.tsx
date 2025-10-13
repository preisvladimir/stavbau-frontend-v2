// src/features/customers/components/CustomerForm.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, type Resolver } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { Collapse } from "@/components/ui/stavbau-ui/collapse";

import { Pencil, ChevronDown, ChevronUp } from "@/components/icons";
import { cn } from '@/lib/utils/cn';
import type { ExtendFormProps } from '@/components/ui/stavbau-ui/forms/types';
import type { CustomerFormValues } from '../validation/schemas';
import { AddressAutocomplete } from '@/components/ui/stavbau-ui/addressautocomplete';
import type { AddressSuggestion } from '@/lib/api/geo';

import type { AddressDto } from '@/types';

// --- Globální feedback (toast/inline rozhodování) ---
import {Button, InlineStatus, useFeedback } from '@/ui';

import { customerSchema, type CustomerFormValues as FormValues } from '../validation/schemas';

type CustomersSpecificProps = {
  /** Rodič může poslat text chyby – pošleme ji do globálního FeedbackProvideru pro zvolený scope */
  serverError?: string | null;
};

export type FormProps = ExtendFormProps<CustomerFormValues, 'create' | 'edit', CustomersSpecificProps>;

export const Form: React.FC<FormProps> = ({
  mode,
  i18nNamespaces,
  defaultValues,
  submitting,
  onSubmit,
  onCancel,
  resetAfterSubmit,
  className,
  serverError,
  //loading = false, // zachováno kvůli kompatibilitě; na zobrazení chyby nepoužíváme
  onClear,
  onDirtyChange,       // ✅ sjednoceno s TeamForm
  autoFocus = true,    // ✅ sjednoceno s TeamForm
}) => {
  const { t } = useTranslation(i18nNamespaces ?? ['customers', 'common']);
  const resolver = zodResolver(customerSchema) as unknown as Resolver<FormValues>;
  const shouldReset = resetAfterSubmit ?? (mode === 'create');

  const feedback = useFeedback();
  const STATUS_SCOPE = 'customers.form';

  // Pokud přijde serverError z rodiče, pošli jej do FeedbackProvideru (inline pro tento scope)
  React.useEffect(() => {
    if (!serverError) return;
    feedback.show({
      severity: 'error',
      title: t('detail.errors.generic', { defaultValue: 'Došlo k chybě' }),
      description: serverError,
      scope: STATUS_SCOPE,
    });
  }, [serverError, feedback, t]);

  // sjednocené defaulty (držíme i pro reset po submitu)
  const defaultValuesResolved = React.useMemo<FormValues>(
    () => ({
      type: 'ORGANIZATION',
      name: '',
      ico: undefined,
      dic: undefined,
      email: undefined,
      phone: undefined,
      billingAddress: undefined,
      defaultPaymentTermsDays: undefined,
      notes: undefined,
      ...(defaultValues as Partial<FormValues>),
    }),
    [defaultValues]
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setFocus,
  } = useForm<FormValues>({
    resolver,
    defaultValues: defaultValuesResolved,
    mode: 'onTouched',        // ✅ stejně jako TeamForm
    reValidateMode: 'onChange',
  });

  // přenastavení zvenčí
  React.useEffect(() => {
    reset(defaultValuesResolved, { keepDirty: false });
  }, [defaultValuesResolved, reset]);

  // hlášení dirty změn rodiči (✅ jako TeamForm)
  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // autofocus + při chybách fokus na první invalid (✅ jako TeamForm)
  React.useEffect(() => {
    if (!autoFocus) return;
    const errKeys = Object.keys(errors);
    if (errKeys.length > 0) {
      setFocus(errKeys[0] as any);
      return;
    }
    if (mode === 'create') setFocus('name');
  }, [errors, autoFocus, mode, setFocus]);

  // GEO → AddressDto (typed)
  const onAddressPick = (addr: AddressSuggestion) => {
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
    setValue('billingAddress', dto, { shouldDirty: true, shouldValidate: false });
  };

  const onSubmitInternal = React.useCallback(
    async (vals: FormValues) => {
      await onSubmit(vals);
      if (shouldReset) reset(defaultValuesResolved, { keepDirty: false });
    },
    [onSubmit, shouldReset, reset, defaultValuesResolved]
  );

  const disabled = submitting || isSubmitting;
  const [manualOpen, setManualOpen] = React.useState(false);

  return (
    <form
      onSubmit={handleSubmit(onSubmitInternal)}
      className={cn('flex flex-col gap-4', className)}
      noValidate
    >
      {/* Globální inline status pro tento formulář (schová se přes onClear z rodiče) */}
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
            {t(errors.name.message as string, { defaultValue: 'Zadejte název' })}
          </span>
        )}
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* ICO */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.ico.label', { defaultValue: 'IČO' })}</span>
          <input
            className="rounded-md border px-3 py-2 font-mono"
            disabled={disabled}
            {...register('ico')}
          />
          {errors.ico && <span className="text-xs text-red-600">{t(errors.ico.message as string)}</span>}
        </label>

        {/* DIC */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.dic.label', { defaultValue: 'DIČ' })}</span>
          <input
            className="rounded-md border px-3 py-2 font-mono"
            disabled={disabled}
            {...register('dic')}
          />
          {errors.dic && <span className="text-xs text-red-600">{t(errors.dic.message as string)}</span>}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Email */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.email.label', { defaultValue: 'E-mail' })}</span>
          <input
            className="rounded-md border px-3 py-2"
            autoComplete="email"
            disabled={disabled}
            {...register('email')}
          />
        {errors.email && (
            <span className="text-xs text-red-600">{t(errors.email.message as string)}</span>
          )}
        </label>

        {/* Phone */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.phone.label', { defaultValue: 'Telefon' })}</span>
          <input
            className="rounded-md border px-3 py-2"
            autoComplete="tel"
            disabled={disabled}
            {...register('phone')}
          />
          {errors.phone && (
            <span className="text-xs text-red-600">{t(errors.phone.message as string)}</span>
          )}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Type */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.type.label', { defaultValue: 'Typ' })}</span>
          <select className="rounded-md border px-3 py-2" disabled={disabled} {...register('type')}>
            <option value="ORGANIZATION">
              {t('form.types.organization', { defaultValue: 'Firma/organizace' })}
            </option>
            <option value="PERSON">
              {t('form.types.person', { defaultValue: 'Osoba' })}
            </option>
          </select>
          {errors.type && (
            <span className="text-xs text-red-600">{t(errors.type.message as string)}</span>
          )}
        </label>

        {/* Default payment terms */}
        <label className="flex flex-col gap-1">
          <span className="text-sm">
            {t('form.defaultPaymentTermsDays.label', { defaultValue: 'Splatnost (dny)' })}
          </span>
          <input
            type="number"
            min={0}
            className="rounded-md border px-3 py-2"
            disabled={disabled}
            {...register('defaultPaymentTermsDays')}
          />
          {errors.defaultPaymentTermsDays && (
            <span className="text-xs text-red-600">
              {t(errors.defaultPaymentTermsDays.message as string)}
            </span>
          )}
        </label>
      </div>

      {/* Adresa – GEO autocomplete + volitelná ruční úprava */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">{t('form.address.label', { defaultValue: 'Adresa' })}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setManualOpen((v) => !v)}
            disabled={disabled}
            aria-expanded={manualOpen}
            aria-controls="manual-address-editor"
          >
            <span className="inline-flex items-center gap-1">
              <Pencil size={16} />
              {manualOpen
                ? (t('form.hideManual', { defaultValue: 'Skrýt ruční úpravu' }) as string)
                : (t('form.editManual', { defaultValue: 'Upravit ručně' }) as string)}
              {manualOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </Button>
        </div>

        <AddressAutocomplete onSelect={onAddressPick} />

        <Collapse open={manualOpen} id="manual-address-editor" className="mt-2">
          <div className="space-y-2">
            <input
              className="rounded-md border px-3 py-2"
              placeholder={t('form.addressFormatted', { defaultValue: 'Adresa (formatted)' }) as string}
              disabled={disabled}
              {...register('billingAddress.formatted')}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                className="rounded-md border px-3 py-2"
                placeholder={t('form.street', { defaultValue: 'Ulice' }) as string}
                disabled={disabled}
                {...register('billingAddress.street')}
              />
              <input
                className="rounded-md border px-3 py-2"
                placeholder={t('form.houseNumber', { defaultValue: 'Číslo popisné' }) as string}
                disabled={disabled}
                {...register('billingAddress.houseNumber')}
              />
              <input
                className="rounded-md border px-3 py-2"
                placeholder={t('form.orientationNumber', { defaultValue: 'Číslo orientační' }) as string}
                disabled={disabled}
                {...register('billingAddress.orientationNumber')}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                className="rounded-md border px-3 py-2"
                placeholder={t('form.city', { defaultValue: 'Město' }) as string}
                disabled={disabled}
                {...register('billingAddress.city')}
              />
              <input
                className="rounded-md border px-3 py-2"
                placeholder={t('form.postalCode', { defaultValue: 'PSČ' }) as string}
                disabled={disabled}
                {...register('billingAddress.postalCode')}
              />
              <input
                className="rounded-md border px-3 py-2"
                placeholder={t('form.countryCode', { defaultValue: 'Země (ISO2)' }) as string}
                disabled={disabled}
                {...register('billingAddress.countryCode')}
              />
            </div>
            {errors.billingAddress?.formatted && (
              <span className="text-xs text-red-600">
                {t(errors.billingAddress.formatted.message as string)}
              </span>
            )}
          </div>
        </Collapse>
      </div>

      {/* Notes */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.notes.label', { defaultValue: 'Poznámka' })}</span>
        <textarea
          className="rounded-md border px-3 py-2"
          rows={4}
          disabled={disabled}
          {...register('notes')}
        />
        {errors.notes && (
          <span className="text-xs text-red-600">{t(errors.notes.message as string)}</span>
        )}
      </label>

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
};
