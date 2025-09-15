import * as React from "react";
import { useTranslation } from "react-i18next";
import { useRegistration } from "../RegistrationWizard";

export const StepIco: React.FC = () => {
  const { t } = useTranslation("registration");
  const { state, setState, next } = useRegistration();

  const [ico, setIco] = React.useState(state.company.ico ?? "");

  const handleNext = () => {
    // Validace přijde v PR 3/7; zde pouze přesun hodnoty do state
    setState((s) => ({ ...s, company: { ...s.company, ico } }));
    next();
  };

  return (
    <div>
      <h2 id="registration-step-title" tabIndex={-1} className="text-xl font-semibold mb-4">
        {t("steps.0.title")}
      </h2>
      <p className="text-muted-foreground mb-4">{t("steps.0.desc")}</p>
      <div className="grid gap-3 max-w-sm">
        <label className="text-sm">{t("fields.ico.label")}</label>
        <input
          className="border rounded-md px-3 py-2"
          value={ico}
          onChange={(e) => setIco(e.target.value)}
          placeholder={t("fields.ico.placeholder") ?? ""}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="border rounded-md px-4 py-2" onClick={handleNext}>
          {t("actions.next")}
        </button>
      </div>
    </div>
  );
};
