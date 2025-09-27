// src/features/registration/components/RegistrationWizard.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { StepIco } from "./steps/StepIco";
import { StepCompany } from "./steps/StepCompany";
import { StepOwner } from "./steps/StepOwner";
import { StepSuccess } from "./steps/StepSuccess";
import type { RegistrationState } from "../api/types";

const EMPTY_STATE: RegistrationState = {
  step: 0,
  maxReachedStep: 0,
  company: {
    ico: "",
    name: "",
    dic: null,
    legalFormCode: null,
    legalFormName: null,
    address: { street: "", city: "", zip: "", country: "CZ" },
  },
  owner: { email: "", password: "", firstName: null, lastName: null, phone: null },
  consents: { termsAccepted: false, marketing: null },
};

const SS_KEY = "registration-state-v1";

// helper: zajistí úzkou unii 0|1|2|3
const clampStep = (n: number): 0 | 1 | 2 | 3 =>
  (n < 0 ? 0 : n > 3 ? 3 : (n as 0 | 1 | 2 | 3));

type Ctx = {
  state: RegistrationState;
  setState: React.Dispatch<React.SetStateAction<RegistrationState>>;
  next: () => void;
  back: () => void;
  goTo: (s: 0 | 1 | 2 | 3) => void;
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
    setState((s) => {
      const nextStep = clampStep(s.step + 1);
      return {
        ...s,
        step: nextStep,
        maxReachedStep: clampStep(Math.max(s.maxReachedStep, nextStep)),
      };
    });
  }, []);

  const back = React.useCallback(() => {
    setState((s) => ({ ...s, step: clampStep(s.step - 1) }));
  }, []);

  const goTo = React.useCallback((target: 0 | 1 | 2 | 3) => {
    setState((s) => ({ ...s, step: clampStep(target) }));
  }, []);

  React.useEffect(() => {
    document.getElementById("registration-step-title")?.focus();
  }, [state.step]);

  const steps = [
    { id: 0 as const, label: t("steps.0.title") },
    { id: 1 as const, label: t("steps.1.title") },
    { id: 2 as const, label: t("steps.2.title") },
    { id: 3 as const, label: t("steps.3.title") },
  ];

  const canNavigateTo = (idx: 0 | 1 | 2 | 3) => idx <= state.maxReachedStep;

  return (
    <RegistrationCtx.Provider value={{ state, setState, next, back, goTo }}>
      <ol className="mb-6 flex items-center gap-2 text-sm">
        {steps.map((s, idx) => {
          const isActive = state.step === s.id;
          const isDone = state.step > s.id;
          const disabled = !canNavigateTo(s.id);
          return (
            <li key={s.id} className="flex items-center">
              <button
                type="button"
                onClick={() => !disabled && goTo(s.id)}
                disabled={disabled}
                aria-disabled={disabled}
                title={
                  disabled ? (t("steps.guard", { defaultValue: "Dokončete předchozí krok." }) as string) : undefined
                }
                className={[
                  "rounded-full w-7 h-7 mr-2 border flex items-center justify-center transition-colors",
                  isActive ? "border-gray-900" : isDone ? "border-gray-500" : "border-gray-300",
                  disabled ? "text-gray-400 cursor-not-allowed" : "hover:underline",
                ].join(" ")}
                aria-current={isActive ? "step" : undefined}
              >
                {idx + 1}
              </button>
              <span className={isActive ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
              {idx < steps.length - 1 && <span className="mx-3 text-muted-foreground/50">—</span>}
            </li>
          );
        })}
      </ol>

      <section className="rounded-xl border border-gray-200 p-6">
        {state.step === 0 && <StepIco />}
        {state.step === 1 && <StepCompany />}
        {state.step === 2 && <StepOwner />}
        {state.step === 3 && <StepSuccess />}
      </section>
    </RegistrationCtx.Provider>
  );
};
