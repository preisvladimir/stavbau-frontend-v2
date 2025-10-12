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
import type { ExtendFormProps } from '@/components/ui/stavbau-ui/forms/types';

// --- Globální feedback (toast/inline rozhodování) ---
import { InlineStatus, useFeedback } from '@/ui/feedback';

type TeamSpecificProps = {
  /** Zamkne výběr company role (např. poslední OWNER) */
  lockCompanyRole?: boolean;
  /** i18n klíč proč je zamčeno (default: errors.lastOwner) */
  lockReasonKey?: string;
  /** V edit módu je e-mail obvykle neměnný – vypnuto lze povolit (jen v 'edit' větvi dává smysl) */
  emailEditableInEdit?: boolean;

  /** Volitelný server error (z rodiče) – zobrazíme inline přes FeedbackProvider */
  serverError?: string | null;
  /** Pokud inline status pochází přímo z formuláře, rodič nám může předat clear handler */
  loading?: boolean;         // kvůli kompatibilitě signatur; zde ho nevyužíváme k zobrazování chyb
  onClear?: () => void;      // pošleme do <InlineStatus ... />
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
    onClear,         // ✅ nově přijímáme
    // loading,      // ponecháno kvůli signatuře
  } = props;

  // edit-only props (narrowing)
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
  const shouldReset = resetAfterSubmit ?? ([mode === 'create']);

  // ✅ globální feedback
  const feedback = useFeedback();
  const STATUS_SCOPE = 'team.form';

  // pokud přijde serverError z rodiče, přepošleme ho do inline statusu
  React.useEffect(() => {
    if (!serverError) return;
    feedback.show({
      severity: 'error',
      title: t('detail.errors.generic', { defaultValue: 'Došlo k chybě' }),
      description: serverError,
      scope: STATUS_SCOPE,
    });
  }, [serverError, feedback, t]);

  // výchozí hodnoty – používáme i při resetu
  const defaultValuesResolved = React.useMemo<AnyTeamFormValues>(
    () => ({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      companyRole: null,
      role: 'VIEWER',
      sendInvite: mode === 'create',
      marketing: false,
      termsAccepted: false,
      ...(defaultValues as Partial<AnyTeamFormValues>),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [JSON.stringify(defaultValues), mode]
  );

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

  React.useEffect(() => {
    reset(defaultValuesResolved, { keepDirty: false });
  }, [defaultValuesResolved, reset]);

  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  React.useEffect(() => {
    if (!autoFocus) return;
    const errKeys = Object.keys(errors);
    if (errKeys.length > 0) {
      setFocus(errKeys[0] as any);
      return;
    }
    if (mode === 'create') setFocus('email');
  }, [errors, autoFocus, mode, setFocus]);

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

          const first = Object.keys(p.errors ?? {})[0];
          if (first) setFocus(first as any);

          // pokud BE neposlal konkrétní field chyby, ukaž inline fallback
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

        // 409 – konflikt (např. duplicitní e-mail)
        if (p.status === 409) {
          feedback.show({
            severity: 'warning',
            title: t('errors.conflict.title', { defaultValue: 'Konflikt' }),
            description: p.detail ?? t('errors.conflict.desc', { defaultValue: 'Záznam byl mezitím změněn.' }),
            scope: STATUS_SCOPE,
          });
          return;
        }

        // 403 – práva (fallback)
        if (p.status === 403) {
          feedback.show({
            severity: 'error',
            title: t('errors.forbidden', { defaultValue: 'Přístup zamítnut' }),
            description: p.detail ?? t('errors.rbac.forbidden', { defaultValue: 'Nemáte oprávnění provést tuto akci.' }),
            scope: STATUS_SCOPE,
          });
          return;
        }

        // 400/404/5xx – generický fallback
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
  const emailDisabled = mode === 'edit' && !emailEditableInEdit ? true : disabled;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitInternal)} noValidate>
      {/* ✅ Globální inline status pro formulář teamu */}
      <InlineStatus scope={STATUS_SCOPE} onClear={onClear} />

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
