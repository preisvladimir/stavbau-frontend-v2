import * as React from "react";
import { useTranslation } from "react-i18next";
import { useRegistration } from "../RegistrationWizard";

export const StepOwner: React.FC = () => {
  const { t } = useTranslation("registration");
  const { state, setState, back } = useRegistration();
  const { owner, consents } = state;

  const updateOwner = <K extends keyof typeof owner>(key: K, value: (typeof owner)[K]) => {
    setState((s) => ({ ...s, owner: { ...s.owner, [key]: value } }));
  };
  const updateConsents = <K extends keyof typeof consents>(key: K, value: (typeof consents)[K]) => {
    setState((s) => ({ ...s, consents: { ...s.consents, [key]: value } }));
  };

  const handleSubmit = () => {
    // Odeslání na BE přijde v PR 5/7; zde zatím jen „placeholder“ akce
    alert(t("steps.2.submitPlaceholder"));
  };

  return (
    <div>
      <h2 id="registration-step-title" tabIndex={-1} className="text-xl font-semibold mb-4">
        {t("steps.2.title")}
      </h2>
      <p className="text-muted-foreground mb-4">{t("steps.2.desc")}</p>

      <div className="grid gap-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">{t("fields.owner.firstName.label")}</label>
            <input className="border rounded-md px-3 py-2 w-full" value={owner.firstName ?? ""} onChange={(e) => updateOwner("firstName", e.target.value || null)} />
          </div>
          <div>
            <label className="text-sm">{t("fields.owner.lastName.label")}</label>
            <input className="border rounded-md px-3 py-2 w-full" value={owner.lastName ?? ""} onChange={(e) => updateOwner("lastName", e.target.value || null)} />
          </div>
        </div>
        <div>
          <label className="text-sm">{t("fields.owner.email.label")}</label>
          <input className="border rounded-md px-3 py-2 w-full" value={owner.email} onChange={(e) => updateOwner("email", e.target.value)} />
        </div>
        <div>
          <label className="text-sm">{t("fields.owner.password.label")}</label>
          <input type="password" className="border rounded-md px-3 py-2 w-full" value={owner.password} onChange={(e) => updateOwner("password", e.target.value)} />
        </div>

        <div className="mt-2">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={!!consents.termsAccepted} onChange={(e) => updateConsents("termsAccepted", e.target.checked)} />
            <span className="text-sm">{t("fields.consents.termsAccepted.label")}</span>
          </label>
        </div>
        <div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={!!consents.marketing} onChange={(e) => updateConsents("marketing", e.target.checked)} />
            <span className="text-sm">{t("fields.consents.marketing.label")}</span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="border rounded-md px-4 py-2" onClick={back}>
          {t("actions.back")}
        </button>
        <button className="border rounded-md px-4 py-2" onClick={handleSubmit}>
          {t("actions.finish")}
        </button>
      </div>
    </div>
  );
};
