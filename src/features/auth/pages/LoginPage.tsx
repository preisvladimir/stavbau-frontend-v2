import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "@/components/icons";

import { AuthService } from "@/features/auth/services/AuthService";
import { useAuth } from "@/features/auth/hooks/useAuth";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
} from "@/ui";
// import { useToast } from "@/lib/ui/ToastProvider"; // až bude k dispozici

const schema = z.object({
  email: z.string().email({ message: "validation.email" }),
  password: z.string().min(6, { message: "validation.password_min" }),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation(["auth", "errors", "common"]);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { login } = useAuth();
  // const { toast } = useToast();
  const toast = (args: any) => console.log("toast:", args); // dočasný fallback

  const [serverErrorKey, setServerErrorKey] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = async (values: FormValues) => {
    setServerErrorKey(null);
    try {
      const res = await AuthService.login({ email: values.email, password: values.password });
      await login(res); // provede /auth/me a naplní role/scopes
      const redirectTo = search.get("redirectTo") || "/app/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        setServerErrorKey("401");
      } else if (status === 429) {
        setServerErrorKey("429");
        toast({
          title: t("429", { ns: "errors" }),
          description: t("tryAgainLater", { ns: "errors", defaultValue: "" }),
        });
      } else {
        setServerErrorKey("5xx");
      }
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle>{t("login.title", { ns: "auth" })}</CardTitle>
            <CardDescription>{t("welcomeBack", { ns: "auth", defaultValue: "Vítejte zpět v platformě Stavbau" })}</CardDescription>
          </CardHeader>
          <CardContent>
            {serverErrorKey && (
              <div role="alert" className="mb-3 text-sm text-red-600">
                {t(serverErrorKey, { ns: "errors", min: 6 })}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="email">
                  {t("login.email", { ns: "auth" })}
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  autoComplete="username"
                  {...register("email")}
                  aria-invalid={!!errors.email || undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-red-600">
                    {t(errors.email.message || "validation.email", { ns: "errors" })}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <label className="mb-1 block text-sm font-medium" htmlFor="password">
                  {t("login.password", { ns: "auth" })}
                </label>
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  autoComplete="current-password"
                  {...register("password")}
                  aria-invalid={!!errors.password || undefined}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-[32px] p-1 text-gray-500 hover:text-black"
                  aria-label={show ? t("hidePassword", { ns: "auth", defaultValue: "Skrýt heslo" }) : t("showPassword", { ns: "auth", defaultValue: "Zobrazit heslo" })}
                  disabled={isSubmitting}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-xs text-red-600">
                    {t(errors.password.message || "validation.password_min", { ns: "errors", min: 6 })}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting /* pokud Button podporuje; jinak nahradit disabled + aria-busy */}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {t("actions.login", { ns: "common" })}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              {t("noCompany", { ns: "auth", defaultValue: "Nemáte ještě firmu?" })}{" "}
              <Link
                to="/register"
                className="font-medium text-black underline underline-offset-2 hover:text-emerald-600"
              >
                {t("registerHere", { ns: "auth", defaultValue: "Zaregistrujte ji zde →" })}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
