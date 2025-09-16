import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistration } from "../RegistrationWizard";
import { step1IcoSchema, type Step1Ico } from "../../validation/schemas";
 
 export const StepIco: React.FC = () => {
   const { t } = useTranslation("registration");
   const { state, setState, next } = useRegistration();
 
  const form = useForm<Step1Ico>({
    mode: "onTouched",
    resolver: zodResolver(step1IcoSchema),
    defaultValues: { ico: state.company.ico ?? "" },
  });
 
  const onSubmit = form.handleSubmit((values) => {
    setState((s) => ({ ...s, company: { ...s.company, ico: values.ico } }));
    next();
  });
 
   return (
     <div>
       <h2 id="registration-step-title" tabIndex={-1} className="text-xl font-semibold mb-4">
         {t("steps.0.title")}
       </h2>
       <p className="text-muted-foreground mb-4">{t("steps.0.desc")}</p>
      <form onSubmit={onSubmit} noValidate className="max-w-sm">
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="ico">{t("fields.ico.label")}</label>
          <input
            id="ico"
            {...form.register("ico")}
            className="border rounded-md px-3 py-2"
            placeholder={t("fields.ico.placeholder") ?? ""}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={!!form.formState.errors.ico || undefined}
            aria-describedby={form.formState.errors.ico ? "ico-error" : undefined}
          />
          {form.formState.errors.ico && (
            <p id="ico-error" role="alert" className="text-red-600 text-sm">
              {t(form.formState.errors.ico.message as string)}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="submit" className="border rounded-md px-4 py-2" disabled={form.formState.isSubmitting}>
            {t("actions.next")}
          </button>
        </div>
      </form>
     </div>
   );
 };
