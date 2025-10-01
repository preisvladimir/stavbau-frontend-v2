import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/stavbau-ui/button';
import { CreateMemberSchema, UpdateMemberSchema, type AnyTeamFormValues } from '../validation/schemas';
import { VISIBLE_ROLES, type CompanyRoleName } from '@/types/common/rbac';

export type TeamFormProps = {
  mode: 'create' | 'edit';
  i18nNamespaces?: string[];
  defaultValues?: Partial<AnyTeamFormValues>;
  submitting?: boolean;
  onSubmit: (values: AnyTeamFormValues) => void; // ← sjednocené
  onCancel: () => void;
  /** Zamkne výběr company role (např. poslední OWNER) */
  lockCompanyRole?: boolean;
  /** i18n klíč proč je zamčeno (default: errors.lastOwner) */
  lockReasonKey?: string;
};

export function TeamForm({
  mode,
  i18nNamespaces,
  defaultValues,
  submitting,
  onSubmit,
  onCancel,
  lockCompanyRole = false,
  lockReasonKey = 'errors.lastOwner',
}: TeamFormProps) {
  const { t } = useTranslation(i18nNamespaces ?? ['team', 'common']);
  const roleLabel = (r: CompanyRoleName | string) => t(`common:companyrole.${r}`, { defaultValue: r });

  const schema = mode === 'create' ? CreateMemberSchema : UpdateMemberSchema;

  const { register, handleSubmit, formState: { errors }, reset } =
    useForm<AnyTeamFormValues>({
      resolver: zodResolver(schema) as unknown as Resolver<AnyTeamFormValues>,
      defaultValues: {
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        companyRole: null,
        role: 'VIEWER',
        sendInvite: true,
        marketing: false,
        termsAccepted: false,
        password: '',
        ...(defaultValues as Partial<AnyTeamFormValues>),
      },
    });

  React.useEffect(() => {
    reset({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      companyRole: null,
      role: 'VIEWER',
      sendInvite: true,
      marketing: false,
      termsAccepted: false,
      password: '',
      ...(defaultValues as Partial<AnyTeamFormValues>),
    });
  }, [defaultValues, reset]);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      {/* Email */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.email.label')}</span>
        <input className="rounded-md border px-3 py-2" type="email" {...register('email')} />
        {errors.email && <span className="text-xs text-red-600">{t(errors.email.message as string, { defaultValue: t('form.email.error') as string })}</span>}
      </label>

      {/* Name */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.firstName.label')}</span>
          <input className="rounded-md border px-3 py-2" {...register('firstName')} />
          {errors.firstName && <span className="text-xs text-red-600">{t(errors.firstName.message as string)}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.lastName.label')}</span>
          <input className="rounded-md border px-3 py-2" {...register('lastName')} />
          {errors.lastName && <span className="text-xs text-red-600">{t(errors.lastName.message as string)}</span>}
        </label>
      </div>

      {/* Phone */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.phone', { defaultValue: 'Telefon' })}</span>
        <input className="rounded-md border px-3 py-2" type="tel" {...register('phone')} />
        {errors.phone && <span className="text-xs text-red-600">{t(errors.phone.message as string)}</span>}
      </label>

      {/* Company role */}
      <label className="flex flex-col gap-1">
        <span className="text-sm">{t('form.companyRole.label')}</span>
        <select
          className="rounded-md border px-3 py-2"
          {...register('companyRole')}
          // ✨ ZAMKNOUT, pokud je poslední OWNER
          disabled={lockCompanyRole}
          aria-disabled={lockCompanyRole || undefined}
          title={lockCompanyRole ? (t(lockReasonKey) as string) : undefined}
        >
          <option value="">{t('form.companyRole.none')}</option>
          {VISIBLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>

        {/* validační chyba ze schématu */}
        {errors.companyRole && (
          <span className="text-xs text-red-600">
            {t(errors.companyRole.message as string)}
          </span>
        )}

        {/* ✨ info proč je pole zamčené (pokud není validační chyba) */}
        {lockCompanyRole && !errors.companyRole && (
          <span className="text-xs text-amber-700">
            {t(lockReasonKey, { defaultValue: 'Nelze odebrat posledního vlastníka.' })}
          </span>
        )}
      </label>

      {/* Password – jen v create módu */}
      {mode === 'create' && (
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('form.password', { defaultValue: 'Heslo' })}</span>
          <input className="rounded-md border px-3 py-2" type="password" autoComplete="new-password" {...register('password')} />
          {errors.password && <span className="text-xs text-red-600">{t(errors.password.message as string)}</span>}
        </label>
      )}

      {/* Send invite */}
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('sendInvite')} />
        <span>{t('form.sendInvite.label')}</span>
      </label>

      {/* Terms + Marketing – jen v create módu */}
      {mode === 'create' && (
        <>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('termsAccepted')} />
            <span>{t('validation.terms.accept', { defaultValue: 'Souhlasím s podmínkami' })}</span>
          </label>
          {errors.termsAccepted && (
            <div className="text-xs text-red-600">{t(errors.termsAccepted.message as string)}</div>
          )}
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('marketing')} />
            <span>{t('form.marketing', { defaultValue: 'Souhlasím se zasíláním novinek' })}</span>
          </label>
        </>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('form.actions.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {t('form.actions.submit')}
        </Button>
      </div>
    </form>
  );
}