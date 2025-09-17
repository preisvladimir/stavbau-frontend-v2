// src/features/registration/components/RegistrationWizard.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { StepIco } from "./steps/StepIco";
import { StepCompany } from "./steps/StepCompany";
import { StepOwner } from "./steps/StepOwner";
import { StepSuccess } from "./steps/StepSuccess";

type Address = { street: string; city: string; zip: string; country: string };
export type CompanyState = {
  ico: string;
  dic?: string | null;
  name: string;
  address: Address;
  legalFormCode?: string | null;
};
export type OwnerState = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};
export type ConsentsState = { termsAccepted: boolean; marketing?: boolean | null };
export type RegistrationState = {
  step: 0 | 1 | 2 | 3;
  company: CompanyState;
  owner: OwnerState;
  consents: ConsentsState;
  result?: { companyId: string; ownerUserId: string; ownerRole: "OWNER"; status: "CREATED" | "EXISTS" | "PENDING_VERIFICATION" };
};

const EMPTY_STATE: RegistrationState = {
  step: 0,
  company: {
    ico: "",
    name: "",
    dic: null,
    legalFormCode: null,
    address: { street: "", city: "", zip: "", country: "CZ" },
  },
  owner: { email: "", password: "", firstName: null, lastName: null, phone: null },
  consents: { termsAccepted: false, marketing: null },
};

const SS_KEY = "registration-state-v1";

type Ctx = {
  state: RegistrationState;
  setState: React.Dispatch<React.SetStateAction<RegistrationState>>;
  next: () => void;
  back: () => void;
  goTo: (s: 0 | 1 | 2) => void;
};

const RegistrationCtx = React.createContext<Ctx | null>(null);
export const useRegistration = () => {
  const ctx = React.useContext(RegistrationCtx);
  if (!ctx) throw new Error("useRegistration must be used within <RegistrationWizard/>");
  return ctx;
};

export const RegistrationWizard: React.FC = () => {
  const { t } = useTranslation("registration");
  const [state, setState] = React.useState<RegistrationState>(() => {
    try {
      const raw = sessionStorage.getItem(SS_KEY);
      return raw ? (JSON.parse(raw) as RegistrationState) : EMPTY_STATE;
    } catch {
      return EMPTY_STATE;
    }
  });

  React.useEffect(() => {
    sessionStorage.setItem(SS_KEY, JSON.stringify(state));
  }, [state]);

  const next = React.useCallback(() => {
    setState((s) => ({ ...s, step: (Math.min(2, s.step + 1) as 0 | 1 | 2 | 3) }));
  }, []);
  const back = React.useCallback(() => {
    setState((s) => ({ ...s, step: (Math.max(0, s.step - 1) as 0 | 1 | 2 | 3) }));
  }, []);
  const goTo = React.useCallback((s: 0 | 1 | 2 | 3) => setState((st) => ({ ...st, step: s })), []);

  React.useEffect(() => {
    const el = document.getElementById("registration-step-title");
    el?.focus();
  }, [state.step]);

  const steps = [
    { id: 0 as const, label: t("steps.0.title") },
    { id: 1 as const, label: t("steps.1.title") },
    { id: 2 as const, label: t("steps.2.title") },
    { id: 3 as const, label: t("steps.3.title") },
  ];

  return (
    <RegistrationCtx.Provider value={{ state, setState, next, back, goTo }}>
      <ol className="mb-6 flex items-center gap-2 text-sm">
        {steps.map((s, idx) => {
          const isActive = state.step === s.id;
          const isDone = state.step > s.id;
          return (
            <li key={s.id} className="flex items-center">
              <button
                type="button"
                className={
                  "rounded-full w-7 h-7 mr-2 border flex items-center justify-center " +
                  (isActive ? "border-primary font-semibold" : isDone ? "border-primary/60" : "border-muted-foreground/30")
                }
                aria-current={isActive ? "step" : undefined}
                onClick={() => goTo(s.id)}
              >
                {idx + 1}
              </button>
              <span className={isActive ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
              {idx < steps.length - 1 && <span className="mx-3 text-muted-foreground/50">—</span>}
            </li>
          );
        })}
      </ol>

      <section className="rounded-lg border p-6">
        {state.step === 0 && <StepIco />}
        {state.step === 1 && <StepCompany />}
        {state.step === 2 && <StepOwner />}
        {state.step === 3 && <StepSuccess />}
      </section>
    </RegistrationCtx.Provider>
  );
};
