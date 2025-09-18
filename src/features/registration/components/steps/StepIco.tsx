import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegistration } from "../RegistrationWizard";
import { step1IcoSchema, type Step1Ico } from "../../validation/schemas";
import { RegistrationService } from "../../services/RegistrationService";
import { mapRegistrationError } from "../../utils/mapRegistrationErrors";
import { type ProblemDetail } from "@/lib/api/types";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/stavbau-ui";

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
      // 1) uložit IČO do state
      setState((s) => ({ ...s, company: { ...s.company, ico: values.ico } }));
      // 2) ARES preview
      const dto = await RegistrationService.getFromAres(values.ico, abortRef.current.signal);
      // 3) prefill do kroku 2
      setState((s) => ({
        ...s,
        company: {
          ...s.company,
          ico: dto.ico,
          dic: dto.dic ?? null,
          name: dto.name ?? "",
          legalFormCode: dto.legalFormCode ?? null,
          legalFormName: dto.legalFormName ?? null,
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
      const pd = isAxiosError(e) ? (e.response?.data as ProblemDetail | undefined) : undefined;
      const mapped = mapRegistrationError(pd);
      setErrorKey(mapped.i18nKey);
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
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {t(errorKey)}
        </div>
      )}

      {/* plná šířka + button vedle inputu na desktopu */}
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
      >
        {/* label přes celou šířku */}
        <label className="text-sm md:col-span-2" htmlFor="ico">
          {t("fields.ico.label")}
        </label>

        {/* input (1fr) */}
        <div>
          <input
            id="ico"
            {...form.register("ico")}
            className="border rounded-md px-3 py-2 w-full"
            placeholder={t("fields.ico.placeholder") ?? ""}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={!!form.formState.errors.ico || undefined}
            aria-describedby={form.formState.errors.ico ? "ico-error" : undefined}
            disabled={loading}
          />
        </div>

        {/* button (auto) */}
        <div className="md:ml-2">
          <Button
            type="submit"
            className="w-full md:w-auto"
            isLoading={loading || form.formState.isSubmitting}
            disabled={loading || form.formState.isSubmitting}
          >
            {t("actions.next")}
          </Button>
        </div>

        {/* error message pod inputem, přes celou šířku */}
        {form.formState.errors.ico && (
          <p id="ico-error" role="alert" className="text-red-600 text-sm md:col-span-2">
            {t(form.formState.errors.ico.message as string)}
          </p>
        )}
      </form>
    </div>
  );
};
