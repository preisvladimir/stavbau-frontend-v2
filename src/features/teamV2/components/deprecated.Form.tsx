// src/features/team/components/TeamForm.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/stavbau-ui/button';
import { CreateMemberSchema, UpdateMemberSchema, type AnyTeamFormValues } from '../validation/schemas';
import { VISIBLE_ROLES, type CompanyRoleName } from '@/types/common/rbac';
import { toApiProblem } from "@/lib/api/problem";
import { applyApiErrorsToForm } from "@/lib/forms/applyApiErrorsToForm";
import { toast } from "@/components/ui/stavbau-ui/toast";
import type { ExtendFormProps } from '@/components/ui/stavbau-ui/forms/types';

type TeamSpecificProps = {
  /** Zamkne výběr company role (např. poslední OWNER) */
  lockCompanyRole?: boolean;
  /** i18n klíč proč je zamčeno (default: errors.lastOwner) */
  lockReasonKey?: string;
  /** V edit módu je e-mail obvykle neměnný – vypnuto lze povolit (jen v 'edit' větvi dává smysl) */
  emailEditableInEdit?: boolean;

};

type TeamFormPropsCreate = ExtendFormProps<
  AnyTeamFormValues,
  'create',
  Omit<TeamSpecificProps, 'emailEditableInEdit'>
>;
type TeamFormPropsEdit = ExtendFormProps<
  AnyTeamFormValues,
  'edit',
  TeamSpecificProps
>;
export type TeamFormProps = TeamFormPropsCreate | TeamFormPropsEdit;

export function Form(props: TeamFormProps) {
  // Společné props (bez edit-only polí)
  const {
    mode,
    i18nNamespaces,
    defaultValues,
    submitting,
    onSubmit,
    onCancel,
    resetAfterSubmit,
    serverError = null,
    onDirtyChange,
    autoFocus = true,
    // className, // případně doplň, pokud ho používáš v <form>
  } = props;

  // Narrowing pro edit-specifické props
  const lockCompanyRole =
    mode === 'edit' ? props.lockCompanyRole ?? false : false;
  const lockReasonKey =
    mode === 'edit' ? props.lockReasonKey ?? 'errors.lastOwner' : 'errors.lastOwner';
  const emailEditableInEdit =
    mode === 'edit' ? props.emailEditableInEdit ?? false : false;

  const { t } = useTranslation(i18nNamespaces ?? ['team', 'common']);
  const roleLabel = (r: CompanyRoleName | string) =>
    t(`roles.${r}`, { defaultValue: String(r) });

  const schema = mode === 'create' ? CreateMemberSchema : UpdateMemberSchema;
  const shouldReset = resetAfterSubmit ?? (mode === 'create');

  // Jednotné výchozí hodnoty – použijeme je i při resetu po submitu
  const defaultValuesResolved = React.useMemo<AnyTeamFormValues>(
    () => ({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      companyRole: null, // důležité pro RHF, ať není undefined
      role: 'VIEWER',
      sendInvite: mode === 'create', // create: true, edit: obvykle ignorováno
      marketing: false,
      termsAccepted: false,
      ...(defaultValues as Partial<AnyTeamFormValues>),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [JSON.stringify(defaultValues), mode]
  ); // stringified dep: stabilní reset při změně obsahu

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setFocus,
    setError,
  } = useForm<AnyTeamFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<AnyTeamFormValues>,
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

  // autofocus po montáži / při chybách
  React.useEffect(() => {
    if (!autoFocus) return;
    // Při chybách fokus na první invalid
    const errKeys = Object.keys(errors);
    if (errKeys.length > 0) {
      setFocus(errKeys[0] as any);
      return;
    }
    // Jinak v create módu fokus na e-mail
    if (mode === 'create') setFocus('email');
  }, [errors, autoFocus, mode, setFocus]);

  // Volitelný serverError → případně mapovat na RHF pole
  React.useEffect(() => {
    if (!serverError) return;
    // setError('email', { type: 'server', message: serverError });
  }, [serverError, setError]);

const onSubmitInternal = React.useCallback(
  async (vals: AnyTeamFormValues) => {
    try {
      await onSubmit(vals);
      if (shouldReset) {
        reset(defaultValuesResolved, { keepDirty: false });
      }
    } catch (err) {
      const p = toApiProblem(err);

      // 422 → mapujeme field chyby do RHF
      if (p.status === 422 && p.errors) {
        const { applied, unknown } = applyApiErrorsToForm<AnyTeamFormValues>(p, setError);

        // fokus na první chybné pole (pokud BE poslal field errors)
        const first = Object.keys(p.errors ?? {})[0];
        if (first) setFocus(first as any);

        // pokud BE neposlal žádné field errors, ukaž obecný fallback
        if (!applied && (p.detail || unknown)) {
          toast.show({
            variant: "error",
            title: "Neplatná data",
            description: p.detail || unknown,
          });
        }
        return; // ukončíme – chyby jsou ve formuláři
      }

      // 409 – konflikt (např. unikátní e-mail)
      if (p.status === 409) {
        toast.show({
          variant: "warning",
          title: "Konflikt",
          description: p.detail ?? "Záznam byl mezitím změněn.",
        });
        return;
      }

      // 403 – práva (většinu případů už řeší globální onForbidden; tady jen fallback)
      if (p.status === 403) {
        toast.show({
          variant: "error",
          title: "Přístup zamítnut",
          description: p.detail ?? "Nemáte oprávnění provést tuto akci.",
        });
        return;
      }

      // 400/404/5xx/ostatní – generický fallback
      toast.show({
        variant: "error",
        title: "Chyba",
        description: p.detail ?? "Nepodařilo se uložit. Zkuste to prosím znovu.",
      });
    }
  },
  [onSubmit, shouldReset, reset, defaultValuesResolved, setError, setFocus]
);

  const disabled = submitting || isSubmitting;
  const emailDisabled = mode === 'edit' && !emailEditableInEdit ? true : disabled;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitInternal)} noValidate>

      {/* Email */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.email.label')}</span>
        <input
          className="rounded-md border px-3 py-2"
          type="email"
          autoComplete="email"
          disabled={emailDisabled}
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? 'err-email' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <span id="err-email" className="text-xs text-red-600">
            {t(errors.email.message as string, { defaultValue: t('form.email.error') as string })}
          </span>
        )}
      </label>

      {/* Name */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.firstName.label')}</span>
          <input
            className="rounded-md border px-3 py-2"
            autoComplete="given-name"
            disabled={disabled}
            aria-invalid={!!errors.firstName || undefined}
            aria-describedby={errors.firstName ? 'err-firstname' : undefined}
            {...register('firstName')}
          />
          {errors.firstName && (
            <span id="err-firstname" className="text-xs text-red-600">
              {t(errors.firstName.message as string)}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.lastName.label')}</span>
          <input
            className="rounded-md border px-3 py-2"
            autoComplete="family-name"
            disabled={disabled}
            aria-invalid={!!errors.lastName || undefined}
            aria-describedby={errors.lastName ? 'err-lastname' : undefined}
            {...register('lastName')}
          />
          {errors.lastName && (
            <span id="err-lastname" className="text-xs text-red-600">
              {t(errors.lastName.message as string)}
            </span>
          )}
        </label>
      </div>

      {/* Phone */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.phone', { defaultValue: 'Telefon' })}</span>
        <input
          className="rounded-md border px-3 py-2"
          type="tel"
          autoComplete="tel"
          disabled={disabled}
          aria-invalid={!!errors.phone || undefined}
          aria-describedby={errors.phone ? 'err-phone' : undefined}
          {...register('phone')}
        />
        {errors.phone && (
          <span id="err-phone" className="text-xs text-red-600">
            {t(errors.phone.message as string)}
          </span>
        )}
      </label>

      {/* Company role */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.companyRole.label')}</span>
        <select
          className="rounded-md border px-3 py-2"
          disabled={lockCompanyRole || disabled}
          aria-disabled={lockCompanyRole || undefined}
          title={lockCompanyRole ? (t(lockReasonKey) as string) : undefined}
          aria-invalid={!!errors.companyRole || undefined}
          aria-describedby={errors.companyRole ? 'err-companyRole' : undefined}
          {...register('companyRole', {
            setValueAs: (v) => (v === '' ? null : v),
          })}
        >
          <option value="">{t('form.companyRole.none')}</option>
          {VISIBLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        {errors.companyRole && (
          <span id="err-companyRole" className="text-xs text-red-600">
            {t(errors.companyRole.message as string)}
          </span>
        )}
        {lockCompanyRole && !errors.companyRole && (
          <span className="text-xs text-amber-700">
            {t(lockReasonKey, { defaultValue: 'Nelze odebrat posledního vlastníka.' })}
          </span>
        )}
      </label>

      {/* Send invite */}
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" disabled={disabled} {...register('sendInvite')} />
        <span>{t('form.sendInvite.label')}</span>
      </label>

      {/* Terms + Marketing – jen v create módu (volitelné) */}
      {mode === 'create' && (
        <>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={disabled} {...register('termsAccepted')} />
            <span>{t('validation.terms.accept', { defaultValue: 'Souhlasím s podmínkami' })}</span>
          </label>
          {errors.termsAccepted && (
            <div className="text-xs text-red-600">{t(errors.termsAccepted.message as string)}</div>
          )}

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={disabled} {...register('marketing')} />
            <span>{t('form.marketing', { defaultValue: 'Souhlasím se zasíláním novinek' })}</span>
          </label>
        </>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
          {t('form.actions.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={disabled}>
          {t('form.actions.submit')}
        </Button>
      </div>
    </form>
  );
}
