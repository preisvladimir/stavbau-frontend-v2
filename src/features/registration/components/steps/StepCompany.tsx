import * as React from "react";
import { useTranslation } from "react-i18next";
import { useRegistration } from "../RegistrationWizard";

export const StepCompany: React.FC = () => {
  const { t } = useTranslation("registration");
  const { state, setState, next, back } = useRegistration();
  const { company } = state;

  const update = <K extends keyof typeof company>(key: K, value: (typeof company)[K]) => {
    setState((s) => ({ ...s, company: { ...s.company, [key]: value } }));
  };
  const updateAddr = <K extends keyof typeof company.address>(key: K, value: (typeof company.address)[K]) => {
    setState((s) => ({ ...s, company: { ...s.company, address: { ...s.company.address, [key]: value } } }));
  };

  return (
    <div>
      <h2 id="registration-step-title" tabIndex={-1} className="text-xl font-semibold mb-4">
        {t("steps.1.title")}
      </h2>
      <p className="text-muted-foreground mb-4">{t("steps.1.desc")}</p>

      <div className="grid gap-4 max-w-lg">
        <div>
          <label className="text-sm">{t("fields.name.label")}</label>
          <input className="border rounded-md px-3 py-2 w-full" value={company.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">{t("fields.dic.label")}</label>
            <input className="border rounded-md px-3 py-2 w-full" value={company.dic ?? ""} onChange={(e) => update("dic", e.target.value || null)} />
          </div>
          <div>
            <label className="text-sm">{t("fields.legalFormCode.label")}</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={company.legalFormCode ?? ""}
              onChange={(e) => update("legalFormCode", e.target.value || null)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">{t("fields.address.street.label")}</label>
            <input className="border rounded-md px-3 py-2 w-full" value={company.address.street} onChange={(e) => updateAddr("street", e.target.value)} />
          </div>
          <div>
            <label className="text-sm">{t("fields.address.city.label")}</label>
            <input className="border rounded-md px-3 py-2 w-full" value={company.address.city} onChange={(e) => updateAddr("city", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">{t("fields.address.zip.label")}</label>
            <input className="border rounded-md px-3 py-2 w-full" value={company.address.zip} onChange={(e) => updateAddr("zip", e.target.value)} />
          </div>
          <div>
            <label className="text-sm">{t("fields.address.country.label")}</label>
            <input className="border rounded-md px-3 py-2 w-full" value={company.address.country} onChange={(e) => updateAddr("country", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button className="border rounded-md px-4 py-2" onClick={back}>
          {t("actions.back")}
        </button>
        <button className="border rounded-md px-4 py-2" onClick={next}>
          {t("actions.next")}
        </button>
      </div>
    </div>
  );
};
