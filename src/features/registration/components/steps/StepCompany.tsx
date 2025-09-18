import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistration } from "../RegistrationWizard";
import { step2CompanySchema, type Step2Company } from "../../validation/schemas";
import { Button } from "@/components/ui/stavbau-ui";

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
      legalFormName: company.legalFormName ?? "",
      address: { ...company.address },
    },
  });

  // pokud je předvyplněno z ARES, uzamkneme vše kromě DIČ
  const isPrefilled = Boolean(company?.ico && company?.name && company?.address?.street);
  const roCls =
    "bg-gray-50 text-gray-700 cursor-not-allowed focus:ring-0 focus:outline-none";

  const onSubmit = form.handleSubmit((values) => {
    setState((s) => ({
      ...s,
      company: {
        ...s.company,
        name: values.name, // read-only, beze změny
        dic: values.dic?.trim() ? values.dic.trim() : null, // jediné editovatelné pole
        legalFormCode:
          values.legalFormCode?.trim() ? values.legalFormCode.trim() : s.company.legalFormCode ?? null,
        address: {
          street: values.address.street,
          city: values.address.city,
          zip: values.address.zip,
          country: values.address.country,
        },
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

      {/* plná šířka karty, žádné max-w */}
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Název firmy + název právní formy pod tím (přes 2 sloupce) */}
        <div className="md:col-span-2">
          <label className="text-sm" htmlFor="name">
            {t("fields.name.label")}
          </label>
          <input
            id="name"
            {...form.register("name")}
            readOnly={isPrefilled}
            aria-readonly={isPrefilled || undefined}
            className={`border rounded-md px-3 py-2 w-full ${isPrefilled ? roCls : ""}`}
            aria-invalid={!!form.formState.errors.name || undefined}
          />
          {state.company.legalFormName && (
            <p className="text-xs text-muted-foreground mt-1">{state.company.legalFormName}</p>
          )}
          {form.formState.errors.name && (
            <p role="alert" className="text-red-600 text-sm">
              {t(form.formState.errors.name.message as string)}
            </p>
          )}
        </div>

        {/* IČO (read-only) + DIČ (editovatelné) */}
        <input type="hidden" {...form.register("legalFormCode")} />
        <div>
          <label className="text-sm" htmlFor="ico">
            {t("fields.ico.label")}
          </label>
          <input
            id="ico"
            value={company.ico}
            readOnly
            aria-readonly
            className={`border rounded-md px-3 py-2 w-full ${roCls}`}
          />
        </div>
        <div>
          <label className="text-sm" htmlFor="dic">
            {t("fields.dic.label")}
          </label>
          <input
            id="dic"
            {...form.register("dic")}
            className="border rounded-md px-3 py-2 w-full"
            aria-invalid={!!form.formState.errors.dic || undefined}
          />
          {form.formState.errors.dic && (
            <p role="alert" className="text-red-600 text-sm">
              {t(form.formState.errors.dic.message as string)}
            </p>
          )}
        </div>

        {/* Adresa (read-only) */}
        <div>
          <label className="text-sm" htmlFor="street">
            {t("fields.address.street.label")}
          </label>
          <input
            id="street"
            {...form.register("address.street")}
            readOnly={isPrefilled}
            aria-readonly={isPrefilled || undefined}
            className={`border rounded-md px-3 py-2 w-full ${isPrefilled ? roCls : ""}`}
            aria-invalid={!!form.formState.errors.address?.street || undefined}
          />
          {form.formState.errors.address?.street && (
            <p role="alert" className="text-red-600 text-sm">
              {t(form.formState.errors.address.street.message as string)}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm" htmlFor="city">
            {t("fields.address.city.label")}
          </label>
          <input
            id="city"
            {...form.register("address.city")}
            readOnly={isPrefilled}
            aria-readonly={isPrefilled || undefined}
            className={`border rounded-md px-3 py-2 w-full ${isPrefilled ? roCls : ""}`}
            aria-invalid={!!form.formState.errors.address?.city || undefined}
          />
          {form.formState.errors.address?.city && (
            <p role="alert" className="text-red-600 text-sm">
              {t(form.formState.errors.address.city.message as string)}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm" htmlFor="zip">
            {t("fields.address.zip.label")}
          </label>
          <input
            id="zip"
            {...form.register("address.zip")}
            readOnly={isPrefilled}
            aria-readonly={isPrefilled || undefined}
            className={`border rounded-md px-3 py-2 w-full ${isPrefilled ? roCls : ""}`}
            aria-invalid={!!form.formState.errors.address?.zip || undefined}
          />
          {form.formState.errors.address?.zip && (
            <p role="alert" className="text-red-600 text-sm">
              {t(form.formState.errors.address.zip.message as string)}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm" htmlFor="country">
            {t("fields.address.country.label")}
          </label>
          <input
            id="country"
            {...form.register("address.country")}
            readOnly={isPrefilled}
            aria-readonly={isPrefilled || undefined}
            className={`border rounded-md px-3 py-2 w-full uppercase ${isPrefilled ? roCls : ""}`}
            aria-invalid={!!form.formState.errors.address?.country || undefined}
          />
          {form.formState.errors.address?.country && (
            <p role="alert" className="text-red-600 text-sm">
              {t(form.formState.errors.address.country.message as string)}
            </p>
          )}
        </div>

        {/* Akce přes celou šířku */}
        <div className="mt-6 md:col-span-2 flex justify-between">
          <Button type="button" className="w-auto" onClick={back} disabled={form.formState.isSubmitting}>
            {t("actions.back")}
          </Button>
          <Button
            type="submit"
            className="w-auto"
            isLoading={form.formState.isSubmitting}
            disabled={form.formState.isSubmitting}
          >
            {t("actions.next")}
          </Button>
        </div>
      </form>
    </div>
  );
};
