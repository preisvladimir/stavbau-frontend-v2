 import * as React from "react";
 import { useTranslation } from "react-i18next";
 import { useForm } from "react-hook-form";
 import { zodResolver } from "@hookform/resolvers/zod";
 import { useRegistration } from "../RegistrationWizard";
 import { step1IcoSchema, type Step1Ico } from "../../validation/schemas";
import { RegistrationService } from "../../services/RegistrationService";
import { mapRegistrationError  } from "../../utils/mapRegistrationErrors";
 
 export const StepIco: React.FC = () => {
   const { t } = useTranslation("registration");
   const { state, setState, next } = useRegistration();
 
   const form = useForm<Step1Ico>({
     mode: "onTouched",
     resolver: zodResolver(step1IcoSchema),
     defaultValues: { ico: state.company.ico ?? "" },
   });
 
  const [errorKey, setErrorKey] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorKey(null);
    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      // 1) Uložit IČO do state (pro případ návratu)
      setState((s) => ({ ...s, company: { ...s.company, ico: values.ico } }));
      // 2) Volání ARES
      const dto = await RegistrationService.getFromAres(values.ico, abortRef.current.signal);
      // 3) Prefill do kroku 2 (ponecháme možnost editace)
      setState((s) => ({
        ...s,
        company: {
          ...s.company,
          ico: dto.ico,
          dic: dto.dic ?? null,
          name: dto.name ?? "",
          legalFormCode: dto.legalFormCode ?? null,
          address: {
            street: dto.address?.street ?? "",
            city: dto.address?.city ?? "",
            zip: dto.address?.zip ?? "",
            country: dto.address?.country ?? "CZ",
          },
        },
      }));
      next();
    } catch (e) {
      setErrorKey(mapRegistrationError(e));
    } finally {
      setLoading(false);
    }
  });
 
   return (
     <div>
       <h2 id="registration-step-title" tabIndex={-1} className="text-xl font-semibold mb-4">
         {t("steps.0.title")}
       </h2>
       <p className="text-muted-foreground mb-4">{t("steps.0.desc")}</p>
      {errorKey && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t(errorKey)}
        </div>
      )}
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
            disabled={loading}
           />
           {form.formState.errors.ico && (
             <p id="ico-error" role="alert" className="text-red-600 text-sm">
               {t(form.formState.errors.ico.message as string)}
             </p>
           )}
         </div>
         <div className="mt-6 flex justify-end gap-2">
          <button
            type="submit"
            className="border rounded-md px-4 py-2"
            disabled={loading || form.formState.isSubmitting}
          >
            {loading ? t("actions.loading") : t("actions.next")}
          </button>
         </div>
       </form>
     </div>
   );
 };
