import * as React from "react";
import { useTranslation } from "react-i18next";
import { RegistrationWizard } from "@/features/registration/components/RegistrationWizard";

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation("registration");
  React.useEffect(() => {
    document.getElementById("registration-title")?.focus();
  }, []);
  return (
    <main className="container mx-auto max-w-3xl p-6">
      <h1 id="registration-title" tabIndex={-1} className="text-2xl font-semibold mb-3">
        {t("title")}
      </h1>
      <p className="text-muted-foreground mb-6">{t("lead")}</p>
      <RegistrationWizard /> {/* ← JSX */}
    </main>
  );
};
