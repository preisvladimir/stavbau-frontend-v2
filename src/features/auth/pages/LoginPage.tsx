
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AuthService } from "@/features/auth/services/AuthService";
import { useAuth } from "@/features/auth/hooks/useAuth";
// Pokud máš v ToastProvider hook, odkomentuj a použij.
// import { useToast } from "@/lib/ui/ToastProvider";

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
  // const { toast } = useToast?.() ?? { toast: (args: any) => console.log("toast:", args) };
  const toast = (args: any) => console.log("toast:", args); // fallback dokud nepřipojíme skutečné toasty

  const [serverErrorKey, setServerErrorKey] = useState<string | null>(null);

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
      await login(res); // provede i /auth/me a naplní role/scopes
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
      <div className="w-full max-w-sm border rounded-2xl p-6 shadow-sm bg-white">
        <h1 className="text-xl font-semibold mb-4">{t("login.title", { ns: "auth" })}</h1>

        {serverErrorKey && (
          <div role="alert" className="mb-3 text-sm text-red-600">
            {t(serverErrorKey, { ns: "errors", min: 6 })}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm mb-1">
              {t("login.email", { ns: "auth" })}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600">
                {t(errors.email.message || "validation.email", { ns: "errors" })}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm mb-1">
              {t("login.password", { ns: "auth" })}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600">
                {t(errors.password.message || "validation.password_min", { ns: "errors", min: 6 })}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg px-3 py-2 border bg-black text-white disabled:opacity-60"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? `${t("actions.login", { ns: "common" })}…` : t("actions.login", { ns: "common" })}
          </button>
        </form>
      </div>
    </div>
  );
}
