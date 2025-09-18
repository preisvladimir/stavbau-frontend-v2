// src/features/registration/components/steps/StepOwner.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";

import { useRegistration } from "../RegistrationWizard";
import { step3OwnerSchema, type Step3Owner } from "../../validation/schemas";
import { RegistrationService } from "../../services/RegistrationService";
import { mapRegistrationError } from "../../utils/mapRegistrationErrors";
import type { ProblemDetail, CompanyRegistrationRequest } from "@/lib/api/types";
import { Button } from "@/components/ui/stavbau-ui";

export const StepOwner: React.FC = () => {
  // t = registration, te = errors
  const { t } = useTranslation("registration");
  const { t: te } = useTranslation("errors");

  // Překladový helper – zvládá "errors.*" i případný "registration.*"
  const tr = (key?: string) => {
    if (!key) return "";
    if (key.startsWith("errors.")) return te(key.replace(/^errors\./, ""));
    if (key.startsWith("registration.")) return t(key.replace(/^registration\./, ""));
    return t(key);
  };

  const { state, setState, back, goTo } = useRegistration();
  const [banner, setBanner] = React.useState<string | null>(null);

  const form = useForm<Step3Owner>({
    mode: "onTouched",
    resolver: zodResolver(step3OwnerSchema),
    defaultValues: {
      firstName: state.owner.firstName ?? "",
      lastName: state.owner.lastName ?? "",
      phone: state.owner.phone ?? "",
      email: state.owner.email,
      password: state.owner.password,
      termsAccepted: !!state.consents.termsAccepted,
      marketing: !!state.consents.marketing,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);

    // Ulož aktuální hodnoty do wizard state
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
      consents: { ...s.consents, termsAccepted: values.termsAccepted, marketing: !!values.marketing },
    }));

    // Payload pro BE
    const body: CompanyRegistrationRequest = {
      company: {
        ico: state.company.ico,
        dic: state.company.dic ?? undefined,
        name: state.company.name,
        address: {
          street: state.company.address.street,
          city: state.company.address.city,
          zip: state.company.address.zip,
          country: state.company.address.country,
        },
        legalFormCode: state.company.legalFormCode ?? undefined,
      },
      owner: {
        email: values.email,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        phone: values.phone || undefined,
      },
      consents: {
        termsAccepted: values.termsAccepted,
        marketing: values.marketing ?? undefined,
      },
    };

    try {
      const res = await RegistrationService.register(body);
      setState((s) => ({
        ...s,
        result: res,
        step: 3,
        maxReachedStep: (Math.max(s.maxReachedStep ?? 0, 3) as 0 | 1 | 2 | 3),
      }));
    } catch (err) {
      if (isAxiosError(err)) {
        const pd = err.response?.data as ProblemDetail | undefined;
        const mapped = mapRegistrationError(pd);

        if (mapped.kind === "field" && mapped.field === "owner.email") {
          form.setError("email", { type: "conflict", message: mapped.i18nKey });
          return;
        }
        if (mapped.kind === "flow" && mapped.i18nKey === "errors.company.exists") {
          setBanner(tr("errors.company.exists_with_cta"));
          goTo(0);
          return;
        }
        if (pd?.status === 400 && pd?.path) {
          const path = String(pd.path);
          if (path.startsWith("owner.")) {
            const field = path.split(".")[1] as keyof Step3Owner;
            form.setError(field, { type: "server", message: pd.code || "errors.validation.generic" });
            return;
          }
          setBanner(tr(pd.code || "errors.validation.generic"));
          return;
        }
        setBanner(tr(mapped.i18nKey));
        return;
      }
      setBanner(tr("errors.generic"));
    }
  });

  React.useEffect(() => {
    document.getElementById("registration-step-title")?.focus();
  }, []);

  return (
    <div>
      <h2 id="registration-step-title" tabIndex={-1} className="text-xl font-semibold mb-4">
        {t("steps.2.title")}
      </h2>
      <p className="text-muted-foreground mb-4">{t("steps.2.desc")}</p>

      {banner && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {banner}
        </div>
      )}

      {/* plná šířka karty; na md+ dvousloupcově, email+password vedle sebe */}
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Jméno / Příjmení */}
        <div>
          <label className="text-sm" htmlFor="firstName">{t("fields.owner.firstName.label")}</label>
          <input id="firstName" {...form.register("firstName")} className="border rounded-md px-3 py-2 w-full" />
        </div>
        <div>
          <label className="text-sm" htmlFor="lastName">{t("fields.owner.lastName.label")}</label>
          <input id="lastName" {...form.register("lastName")} className="border rounded-md px-3 py-2 w-full" />
        </div>

        {/* Telefon (celá šířka) */}
        <div className="md:col-span-2">
          <label className="text-sm" htmlFor="phone">{t("fields.owner.phone.label")}</label>
          <input id="phone" {...form.register("phone")} className="border rounded-md px-3 py-2 w-full" />
        </div>

        {/* Email + Heslo vedle sebe na md+ */}
        <div>
          <label className="text-sm" htmlFor="email">{t("fields.owner.email.label")}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register("email")}
            className="border rounded-md px-3 py-2 w-full"
            aria-invalid={!!form.formState.errors.email || undefined}
          />
          {form.formState.errors.email && (
            <p role="alert" className="text-red-600 text-sm">
              {tr(form.formState.errors.email.message as string)}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm" htmlFor="password">{t("fields.owner.password.label")}</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
            className="border rounded-md px-3 py-2 w-full"
            aria-invalid={!!form.formState.errors.password || undefined}
          />
          {form.formState.errors.password && (
            <p role="alert" className="text-red-600 text-sm">
              {tr(form.formState.errors.password.message as string)}
            </p>
          )}
        </div>

        {/* Souhlasy (oba přes celou šířku) */}
        <div className="md:col-span-2 mt-2">
          <label className="inline-flex items-center gap-2" htmlFor="termsAccepted">
            <input id="termsAccepted" type="checkbox" {...form.register("termsAccepted")} />
            <span className="text-sm">{t("fields.consents.termsAccepted.label")}</span>
          </label>
          {form.formState.errors.termsAccepted && (
            <p role="alert" className="text-red-600 text-sm">
              {tr(form.formState.errors.termsAccepted.message as string)}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="inline-flex items-center gap-2" htmlFor="marketing">
            <input id="marketing" type="checkbox" {...form.register("marketing")} />
            <span className="text-sm">{t("fields.consents.marketing.label")}</span>
          </label>
        </div>

        {/* Akce */}
        <div className="mt-6 md:col-span-2 flex justify-between">
          <Button type="button" className="w-auto" onClick={back} disabled={form.formState.isSubmitting}>
            {t("actions.back")}
          </Button>
          <Button type="submit" className="w-auto" isLoading={form.formState.isSubmitting} disabled={form.formState.isSubmitting}>
            {t("actions.finish")}
          </Button>
        </div>
      </form>
    </div>
  );
};
