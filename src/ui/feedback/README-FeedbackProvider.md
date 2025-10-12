# README

Tento dokument popisuje dva malé, ale důležité “infrastrukturní” prvky aplikace:

- `@/ui/feedback` – sjednocený způsob zobrazování stavových hlášek (toasty + inline status lišty).
- `@/auth/bootstrapErrorHandlers` – registrace globálních API error handlerů (403/429/…).

Cílem je mít jednotné API, minimální lepidlo v obrazovkách a dlouhodobě udržitelné chování.

---

## `@/ui/feedback`

### Co to řeší

- Jednotné toasty (`toast.show({...})`) pro běžné notifikace.
- **Inline** status lišta (`<InlineStatus scope="..."/>`) – neblokující upozornění přímo na stránce, řízené přes `useFeedback()`.
- Jednoduché mapování chyb (`showError(err, { scope, title })`) s normalizací přes `toApiProblem`.

### Instalace / zapojení

`main.tsx`:

```tsx
import { FeedbackProvider } from "@/ui/feedback";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FeedbackProvider toastPosition="bottom-right" toastMax={3} toastDuration={4000}>
      <RouterProvider router={router} />
    </FeedbackProvider>
  </React.StrictMode>
);
```

> `FeedbackProvider` wrapuje `ToastProvider` a vystavuje kontext `useFeedback()`.

### API

```ts
type Severity = 'info' | 'success' | 'warning' | 'error';
type Scope = string;

type FeedbackCtx = {
  // 1) “smart” – pošli error (unknown) a volitelný scope
  showError: (err: unknown, opts?: { scope?: Scope; title?: string }) => void;

  // 2) Explicitní – pošli přímo zprávu
  show: (msg: { severity: Severity; title?: string; description?: string; scope?: Scope }) => void;

  // 3) Vyčisti inline msg pro scope
  clear: (scope: Scope) => void;
};
```

### Použití – toasty

```tsx
import { toast } from "@/ui/toast";

// success
toast.show({ variant: "success", title: "Uloženo" });

// warning s popisem
toast.show({
  variant: "warning",
  title: "Konflikt",
  description: "Záznam byl mezitím změněn.",
});
```

### Použití – inline status (scoped)

1) Na stránce, kde chceš inline lištu:

```tsx
import { InlineStatus, useFeedback } from "@/ui/feedback";

export default function TeamPage() {
  const feedback = useFeedback();
  // ...
  return (
    <>
      <InlineStatus scope="team.list" />
      {/* zbytek stránky */}
    </>
  );
}
```

2) Kdekoliv na stránce (handler, hook…), pošli hlášku do konkrétního scope:

```tsx
feedback.show({
  scope: "team.list",
  severity: "success",
  title: "Člen přidán",
  description: "Přidali jsme nového člena do týmu.",
});

// Nebo při chybě:
feedback.showError(error, {
  scope: "team.list",
  title: "Načtení selhalo",
});
```

Inline lišta se vykreslí, pokud je na stránce přihlášen `<InlineStatus scope="team.list"/>`.  
Pokud **není**, spadne hláška automaticky do **toastu**.  
To znamená: **stejné API**, žádné `if` kolem.

### UX doporučení

- **Krátké titulky**, popis pouze pokud dává smysl.
- Inline status používej pro “měkké” problémy konkrétní sekce (např. částečně selhalo načtení tabulky).
- Globální chyby (auth, síť) -> globální toasty nebo error boundary.

---

## `@/auth/bootstrapErrorHandlers`

### Co to řeší

- Jednotná reakce na vybrané API chyby z `tokenManager`.
- Aktuálně pokrývá:
  - **403 Forbidden** – zobrazí srozumitelnou hlášku s detailními scopes (pokud dorazí z BE).
  - **429 Too Many Requests** – jemný warning.
  - (Volitelně) **401 Unauthorized** – prostor pro redirect na login apod.

### Zapojení

`main.tsx`:

```tsx
import { registerGlobalApiErrorHandlers } from "@/auth/bootstrapErrorHandlers";

// registrace hned při startu aplikace (idempotentní)
registerGlobalApiErrorHandlers();
```

### Implementační poznámky

- Registrace je **idempotentní** – opakované volání nic nerozbije (interní guard `_registered`).
- Lokalizace přes `i18n.t(...)` s fallbacky.
- Při 403 se pokusí vypsat `requiredScopes` (pokud je BE vrátí).

### Vzorový kód (zjednodušený)

```ts
// src/auth/bootstrapErrorHandlers.ts
import { tokenManager } from "@/lib/api/tokenManager";
import { toast } from "@/ui/toast";
import i18n from "@/i18n";
import type { ApiProblem } from "@/lib/api/problem";

let _registered = false;

export function registerGlobalApiErrorHandlers() {
  if (_registered) return;
  _registered = true;

  tokenManager.register({
    onForbidden: (p?: ApiProblem) => {
      const key = p?.code ?? "rbac.forbidden";
      const base = i18n.t(`errors:${key}`, {
        defaultValue: p?.detail || i18n.t("errors:rbac.forbidden_fallback"),
      });
      const scopes =
        Array.isArray(p?.requiredScopes) && p.requiredScopes.length
          ? ` (${p.requiredScopes.join(", ")})`
          : "";

      toast.show({
        variant: "error",
        title: i18n.t("errors:title.forbidden"),
        description: `${base}${scopes}`,
      });
    },

    onRateLimit: () => {
      toast.show({
        variant: "warning",
        title: i18n.t("errors:title.too_many_requests"),
        description: i18n.t("errors:rate_limited"),
      });
    },

    // onUnauthorized: () => {
    //   // např. redirect na /login nebo tichá obnova tokenu
    // },
  });
}
```

---

## Doporučené vzory v obrazovkách

### 1) Server-side tabulka

```tsx
const {
  data, loading, error, clearError,
  // ...
} = useServerTableState({
  fetcher,
  onError: (e) => {
    // Inline do konkrétního scope (pokud je <InlineStatus/> přítomen),
    // jinak padne do toastu:
    feedback.showError(e, {
      scope: "customers.list",
      title: t("errors.loadFailed"),
    });
  },
});

return (
  <>
    <TableHeader title={t("customers:title")} />
    <InlineStatus scope="customers.list" />
    {/* Tabulka… */}
  </>
);
```

### 2) Formulář s mapováním server chyb

- 422 (validation) mapuj do RHF přes `applyApiErrorsToForm`.
- 409/403/500… přes `toast.show` nebo `feedback.showError`.

```ts
try {
  await onSubmit(vals);
  toast.show({ variant: "success", title: t("toasts.saved") });
} catch (err) {
  const p = toApiProblem(err);
  if (p.status === 422 && p.errors) {
    applyApiErrorsToForm(p, setError);
    return;
  }
  if (p.status === 409) {
    toast.show({ variant: "warning", title: t("errors.conflict"), description: p.detail });
    return;
  }
  feedback.showError(err, { scope: "project.form", title: t("errors.generic") });
}
```

---

## FAQ

**Musím všude vkládat `<InlineStatus/>`?**  
Ne. Je to opt-in. Když není přítomen, zprávy do daného scope skončí jako toasty.

**Kdy použít inline vs. toast?**  
- Inline: kontextová, “měkká” hláška v rámci sekce stránky (např. dílčí fetch selhal).
- Toast: obecné notifikace (úspěch uložení, globální chyba).

**Co když chci mít plně “globální” inline bar?**  
Můžeš vytvořit globální `<InlineStatus scope="global"/>` v layoutu a posílat `scope: "global"`.  
Doporučujeme ale držet **granularitu per-page/per-feature**, je to čitelnější pro uživatele.

**Jak vyřešit a11y u icon-only tlačítek (close X)?**  
Náš `<Button>` kontroluje icon-only a vyžaduje `ariaLabel`.  
Příklad:

```tsx
<Button
  size="icon"
  variant="ghost"
  ariaLabel={t("common:close")}
  leftIcon={<X size={16} />}
/>
```

---

## Shrnutí

- `@/ui/feedback` ti dává **jedno místo** pro toasty i inline stavy s velmi jednoduchým API.
- `@/auth/bootstrapErrorHandlers` pokrývá **globální chyby** automaticky a konzistentně.
- Minimalizuješ lepidlo v obrazovkách, chování je předvídatelné a snadno udržitelné.
