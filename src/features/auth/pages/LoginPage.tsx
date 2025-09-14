
/** TODO: RHF + Zod form, i18n hlášky, 401/429 inline+toast, loading state */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { AuthService } from "@/features/auth/services/AuthService";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSearchParams, useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email({ message: "validation.email" }),
  password: z.string().min(6, { message: "validation.password_min" }),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation(["auth", "errors"]);
  const { login } = useAuth();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [serverErrorKey, setServerErrorKey] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setServerErrorKey(null);
    try {
      const res = await AuthService.login({ email: data.email, password: data.password });
      await login(res); // provede i /auth/me
      const redirectTo = search.get("redirectTo") || "/app/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) setServerErrorKey("401");
      else if (status === 429) setServerErrorKey("429");
      else setServerErrorKey("5xx");
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm border rounded-2xl p-6 shadow-sm bg-white">
        <h1 className="text-xl font-semibold mb-4">{t("login.title", { ns: "auth" })}</h1>
        {serverErrorKey && (
          <div role="alert" className="mb-3 text-sm text-red-600">
            {t(serverErrorKey, { ns: "errors", min: 6 })}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm mb-1" htmlFor="email">{t("login.email", { ns: "auth" })}</label>
            <input
              id="email"
              type="email"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600">
                {t(errors.email.message || "validation.email", { ns: "errors", min: 6 })}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="password">{t("login.password", { ns: "auth" })}</label>
            <input
              id="password"
              type="password"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              autoComplete="current-password"
              {...register("password")}              aria-invalid={!!errors.password}
             aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600">
                {t(errors.password.message || "validation.password_min", { ns: "errors", min: 6 })}
              </p>
            )}
          </div>
          <button
           type="submit"
           disabled={isSubmitting}
            className="w-full rounded-lg px-3 py-2 border bg-black text-white disabled:opacity-60"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? t("common:actions.login") + "…" : t("common:actions.login")}
          </button>
        </form>
      </div>
    </div>
  );
}
