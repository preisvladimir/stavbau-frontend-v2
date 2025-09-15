import * as React from "react";
import { useTranslation } from "react-i18next";

export const RegisterPage: React.FC = () => {
 const { t } = useTranslation("registration");

 React.useEffect(() => {
   // A11y: po příchodu focus na hlavní nadpis
   const h1 = document.getElementById("registration-title");
    h1?.focus();
  }, []);

  return (
    <main className="container mx-auto max-w-3xl p-6">
      <h1 id="registration-title" tabIndex={-1} className="text-2xl font-semibold mb-3">
        {t("title")}
     </h1>
      <p className="text-muted-foreground mb-6">{t("lead")}</p>
      {/* Wizard se doplní v PR 2/7 */}
     <div className="rounded-lg border p-6">
        <p className="mb-0">{t("placeholder.nextStep")}</p>
      </div>
    </main> 
 );
};
