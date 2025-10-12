// src/auth/bootstrapErrorHandlers.ts
import { tokenManager } from "@/lib/api/tokenManager";
import { toast } from "@/ui/toast";
import i18n from "@/i18n";
import type { ApiProblem } from "@/lib/api/problem";

/** Jednoduchý cooldown na spam stejných toastů (per klíč). */
const lastShown = new Map<string, number>();
function showToastOnce(key: string, cb: () => void, cooldownMs = 2000) {
  const now = Date.now();
  const last = lastShown.get(key) ?? 0;
  if (now - last >= cooldownMs) {
    lastShown.set(key, now);
    cb();
  }
}

/** Guard proti vícenásobné registraci (HMR, opakované volání). */
let _registered = false;
/** Funkce pro odregistraci všech handlerů (když by bylo potřeba). */
let _unsubscribeAll: (() => void) | null = null;

/**
 * Zaregistruje globální API error handlery.
 * - Idempotentní: druhé a další volání vrací původní `unsubscribe` (no-op, když už neexistuje).
 * - SSR-safe: na serveru neprovádí registraci (jen vrátí no-op).
 * - Vrací `unsubscribe` pro případné odregistrování (např. testy).
 */
export function registerGlobalApiErrorHandlers(): () => void {
  // SSR guard – na serveru neregistrujeme nic
  if (typeof window === "undefined") {
    return () => {};
  }

  if (_registered && _unsubscribeAll) {
    return _unsubscribeAll;
  }
  if (_registered) {
    // fallback – neměl by nastat, ale ať to nikdy „nevybouchne“
    return () => {};
  }

  _registered = true;
  const offs: Array<() => void> = [];

  // Bezpečné přidání "off" do seznamu (tokenManager.register může vracet off nebo nic)
  const safePushOff = (off: unknown) => {
    if (typeof off === "function") offs.push(off as () => void);
  };

  // ---- Handlery ----
  const off = tokenManager.register({
    onForbidden: (p?: ApiProblem) => {
      const key = p?.code ?? "rbac.forbidden";
      const base =
        i18n.t?.(`errors:${key}`, {
          defaultValue:
            p?.detail ??
            i18n.t?.("errors:rbac.forbidden_fallback", "Nemáte oprávnění.") ??
            "Nemáte oprávnění.",
        }) ??
        p?.detail ??
        "Nemáte oprávnění.";

      const scopes =
        Array.isArray(p?.requiredScopes) && p.requiredScopes.length
          ? ` (${p.requiredScopes.join(", ")})`
          : "";

      // cooldown: nezahlť toasty při batched 403
      showToastOnce(`forbidden:${scopes}`, () => {
        toast.show({
          variant: "error",
          title:
            i18n.t?.("errors:title.forbidden", "Přístup zamítnut") ??
            "Přístup zamítnut",
          description: `${base}${scopes}`,
        });
      });
    },

    onRateLimit: () => {
      showToastOnce("rate-limit", () => {
        toast.show({
          variant: "warning",
          title:
            i18n.t?.("errors:title.too_many_requests", "Příliš mnoho požadavků") ??
            "Příliš mnoho požadavků",
          description:
            i18n.t?.("errors:rate_limited", "Zkuste to prosím znovu za chvíli.") ??
            "Zkuste to prosím znovu za chvíli.",
        });
      });
    },

    // onUnauthorized: () => { /* volitelné: např. redirect na /login, ale ponech často na router guardech */ },
  });

  safePushOff(off);

  // Unsubscribe všech handlerů (kdyby bylo někdy potřeba)
  _unsubscribeAll = () => {
    try {
      for (const off of offs) {
        try {
          off();
        } catch {
          // polkni – nechceme crash kvůli odregistraci
        }
      }
    } finally {
      offs.length = 0;
      _registered = false;
      _unsubscribeAll = null;
      lastShown.clear(); // ať se resetne cooldown stav
    }
  };

  return _unsubscribeAll;
}
