import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistration } from "../RegistrationWizard";
import { step2CompanySchema, type Step2Company } from "../../validation/schemas";

export const StepCompany: React.FC = () => {
  const { t } = useTranslation("registration");
  const { state, setState, next, back } = useRegistration();

  const { company } = state;
  const form = useForm<Step2Company>({
    mode: "onTouched",
    resolver: zodResolver(step2CompanySchema),
    defaultValues: {
      name: company.name,
      dic: company.dic ?? "",
      legalFormCode: company.legalFormCode ?? "",
      address: { ...company.address },
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setState((s) => ({
      ...s,
      company: {
        ...s.company,
        name: values.name,
        dic: values.dic || null,
        legalFormCode: values.legalFormCode || null,
        address: values.address,
      },
    }));
    next();
  });

  return (
    <div>
      <h2 id="registration-step-title" tabIndex={-1} className="text-xl font-semibold mb-4">
        {t("steps.1.title")}
      </h2>
      <p className="text-muted-foreground mb-4">{t("steps.1.desc")}</p>

      <form onSubmit={onSubmit} noValidate className="max-w-lg grid gap-4">
        <div>
          <label className="text-sm" htmlFor="name">{t("fields.name.label")}</label>
          <input id="name" {...form.register("name")} className="border rounded-md px-3 py-2 w-full" aria-invalid={!!form.formState.errors.name || undefined} />
          {form.formState.errors.name && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.name.message as string)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm" htmlFor="dic">{t("fields.dic.label")}</label>
            <input id="dic" {...form.register("dic")} className="border rounded-md px-3 py-2 w-full" aria-invalid={!!form.formState.errors.dic || undefined} />
            {form.formState.errors.dic && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.dic.message as string)}</p>}
          </div>
          <div>
            <label className="text-sm" htmlFor="legalFormCode">{t("fields.legalFormCode.label")}</label>
            <input id="legalFormCode" {...form.register("legalFormCode")} className="border rounded-md px-3 py-2 w-full" aria-invalid={!!form.formState.errors.legalFormCode || undefined} />
            {form.formState.errors.legalFormCode && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.legalFormCode.message as string)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm" htmlFor="street">{t("fields.address.street.label")}</label>
            <input id="street" {...form.register("address.street")} className="border rounded-md px-3 py-2 w-full" aria-invalid={!!form.formState.errors.address?.street || undefined} />
            {form.formState.errors.address?.street && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.address.street.message as string)}</p>}
          </div>
          <div>
            <label className="text-sm" htmlFor="city">{t("fields.address.city.label")}</label>
            <input id="city" {...form.register("address.city")} className="border rounded-md px-3 py-2 w-full" aria-invalid={!!form.formState.errors.address?.city || undefined} />
            {form.formState.errors.address?.city && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.address.city.message as string)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm" htmlFor="zip">{t("fields.address.zip.label")}</label>
            <input id="zip" {...form.register("address.zip")} className="border rounded-md px-3 py-2 w-full" aria-invalid={!!form.formState.errors.address?.zip || undefined} />
            {form.formState.errors.address?.zip && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.address.zip.message as string)}</p>}
          </div>
          <div>
            <label className="text-sm" htmlFor="country">{t("fields.address.country.label")}</label>
            <input id="country" {...form.register("address.country")} className="border rounded-md px-3 py-2 w-full uppercase" aria-invalid={!!form.formState.errors.address?.country || undefined} />
            {form.formState.errors.address?.country && <p role="alert" className="text-red-600 text-sm">{t(form.formState.errors.address.country.message as string)}</p>}
          </div>
        </div>

        <div className="mt-2 flex justify-between">
          <button type="button" className="border rounded-md px-4 py-2" onClick={back}>
            {t("actions.back")}
          </button>
          <button type="submit" className="border rounded-md px-4 py-2" disabled={form.formState.isSubmitting}>
            {t("actions.next")}
          </button>
        </div>
      </form>
    </div>
  );
};
