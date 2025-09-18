import * as React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/stavbau-ui";
import { RegistrationWizard } from "../components/RegistrationWizard";

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation("registration");

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      {/* Registrace má víc polí než login → širší karta */}
      <div className="w-full max-w-2xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("lead")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationWizard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
