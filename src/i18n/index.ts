import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// ↓ Importy JSON slovníků (Vite/TS: resolveJsonModule musí být true)
import cs_common from "./cs/common.json";
import cs_errors from "./cs/errors.json";
import cs_auth from "./cs/auth.json";
import cs_registration from "./cs/registration.json";
import cs_team from "./cs/team.json";
import cs_customers from "./cs/customers.json";
//import cs_projects from "./cs/projects.json";

import en_common from "./en/common.json";
import en_errors from "./en/errors.json";
import en_auth from "./en/auth.json";
import en_registration from "./en/registration.json";
import en_team from "./en/team.json";
import en_customers from "./cs/customers.json";
//import en_projects from "./en/projects.json";

const resources = {
  cs: {
    common: cs_common,
    errors: cs_errors,
    auth: cs_auth,
    registration: cs_registration,
    team: cs_team,
    customers: cs_customers,
    //projects: cs_projects,
  },
  en: {
    common: en_common,
    errors: en_errors,
    auth: en_auth,
    registration: en_registration,
    team: en_team,
    customers: en_customers,
    //projects: en_projects,
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    // Výchozí a fallback jazyk – pro MVP necháme cs
    lng: "cs",
    fallbackLng: "cs",
    // Namespaces, které načítáme (musí ladit s tím, co importujeme výše)
    ns: ["common", "errors", "auth", "projects"],
    defaultNS: "common",

    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
