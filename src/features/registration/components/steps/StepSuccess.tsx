// src/features/registration/components/steps/StepSuccess.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../RegistrationWizard";

export const StepSuccess: React.FC = () => {
  const { t } = useTranslation("registration");
  const { state, setState, goTo } = useRegistration();
  const nav = useNavigate();

  React.useEffect(() => {
    document.getElementById("registration-step-title")?.focus();
  }, []);

  const resetAll = () => {
    // vyčistit session a vrátit wizard na začátek
    try {
      sessionStorage.removeItem("registration-state-v1");
    } catch {}
    setState(() => ({
      step: 0,
      company: {
        ico: "",
        dic: null,
        name: "",
        legalFormCode: null,
        address: { street: "", city: "", zip: "", country: "CZ" },
      },
      owner: { email: "", password: "", firstName: null, lastName: null, phone: null },
      consents: { termsAccepted: false, marketing: null },
      result: undefined,
    }));
    goTo(0);
  };

  return (
    <div>
      <h2 id="registration-step-title" tabIndex={-1} className="text-xl font-semibold mb-4">
        {t("steps.3.title")}
      </h2>
      <p className="text-muted-foreground mb-4">{t("steps.3.desc")}</p>

      <div className="rounded-md border p-4 mb-6">
        <p className="mb-1">{t("success.companyId", { id: state.result?.companyId ?? "—" })}</p>
        <p className="mb-1">{t("success.ownerUserId", { id: state.result?.ownerUserId ?? "—" })}</p>
        <p className="mb-0">{t("success.status", { status: state.result?.status ?? "CREATED" })}</p>
      </div>

      <div className="flex gap-2">
        <button className="border rounded-md px-4 py-2" onClick={() => nav("/login")}>
          {t("success.cta.login")}
        </button>
        <button className="border rounded-md px-4 py-2" onClick={resetAll}>
          {t("success.cta.registerAnother")}
        </button>
      </div>
    </div>
  );
};
