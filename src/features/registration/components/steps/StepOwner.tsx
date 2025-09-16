import * as React from "react";
import { useTranslation } from "react-i18next";
import { useRegistration } from "../RegistrationWizard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step3OwnerSchema, type Step3Owner } from "../../validation/schemas";

export const StepOwner: React.FC = () => {
  const { t } = useTranslation("registration");

  const { state, setState, back } = useRegistration();
  const { owner, consents } = state;
  const form = useForm<Step3Owner>({
    mode: "onTouched",
    resolver: zodResolver(step3OwnerSchema),
    defaultValues: {
      firstName: owner.firstName ?? "",
      lastName: owner.lastName ?? "",
      phone: owner.phone ?? "",
      email: owner.email,
      password: owner.password,
      termsAccepted: !!consents.termsAccepted, // boolean OK
      marketing: !!consents.marketing,         // boolean OK
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setState((s) => ({
      ...s,
      owner: {
        ...s.owner,
        firstName: values.firstName || null,
        lastName: values.lastName || null,
        phone: values.phone || null,
        email: values.email,
        password: values.password,
      },
      consents: {
        ...s.consents,
        termsAccepted: values.termsAccepted,
        marketing: !!values.marketing,
      },
    }));
    // Finální submit přijde v PR 5/7 (POST /tenants/register)
    alert(t("steps.2.submitPlaceholder"));
  });

  return (
    <div>
      <h2 id="registration-step-title" tabIndex={-1} className="text-xl font-semibold mb-4">
        {t("steps.2.title")}
      </h2>
      <p className="text-muted-foreground mb-4">{t("steps.2.desc")}</p>

      <form onSubmit={onSubmit} noValidate className="grid gap-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm" htmlFor="firstName">{t("fields.owner.firstName.label")}</label>
            <input id="firstName" {...form.register("firstName")} className="border rounded-md px-3 py-2 w-full" />
          </div>
          <div>
            <label className="text-sm" htmlFor="lastName">{t("fields.owner.lastName.label")}</label>
            <input id="lastName" {...form.register("lastName")} className="border rounded-md px-3 py-2 w-full" />
          </div>
        </div>

        <div>
          <label className="text-sm" htmlFor="email">{t("fields.owner.email.label")}</label>
          <input id="email" {...form.register("email")} className="border rounded-md px-3 py-2 w-full" aria-invalid={!!form.formState.errors.email || undefined} />
          {form.formState.errors.email && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.email.message as string)}</p>}
        </div>

        <div>
          <label className="text-sm" htmlFor="password">{t("fields.owner.password.label")}</label>
          <input id="password" type="password" {...form.register("password")} className="border rounded-md px-3 py-2 w-full" aria-invalid={!!form.formState.errors.password || undefined} />
          {form.formState.errors.password && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.password.message as string)}</p>}
        </div>

        <div className="mt-2">
          <label className="inline-flex items-center gap-2" htmlFor="termsAccepted">
            <input id="termsAccepted" type="checkbox" {...form.register("termsAccepted")} />
            <span className="text-sm">{t("fields.consents.termsAccepted.label")}</span>
          </label>
          {form.formState.errors.termsAccepted && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.termsAccepted.message as string)}</p>}
        </div>
        <div>
          <label className="inline-flex items-center gap-2" htmlFor="marketing">
            <input id="marketing" type="checkbox" {...form.register("marketing")} />
            <span className="text-sm">{t("fields.consents.marketing.label")}</span>
          </label>
        </div>

        <div className="mt-6 flex justify-between">
          <button type="button" className="border rounded-md px-4 py-2" onClick={back}>
            {t("actions.back")}
          </button>
          <button type="submit" className="border rounded-md px-4 py-2" disabled={form.formState.isSubmitting}>
            {t("actions.finish")}
          </button>
        </div>
      </form>
    </div>
  );
};
