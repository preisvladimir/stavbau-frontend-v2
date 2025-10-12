import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiProblem } from "@/lib/api/problem";

/**
 * Převede RFC7807 `problem.errors` na RHF setError(field, { message }).
 * - Podporuje i dot-notaci pro vnořená pole (např. "address.street").
 * - Hodnoty mohou být string | string[] | { message: string } | unknown → vždy vybereme 1. smysluplnou zprávu.
 * - Pokud BE pošle klíč `_form` nebo "" → nastavíme "root" error (RHF).
 *   (Root error můžeš zobrazit jako banner nad formulářem.)
 */
export function applyApiErrorsToForm<TFieldValues extends FieldValues>(
  problem: ApiProblem,
  setError: UseFormSetError<TFieldValues>
): { applied: number; unknown?: string } {
  const errs = problem?.errors;
  let applied = 0;
  if (!errs || typeof errs !== "object") return { applied };

  const toMessage = (val: unknown): string => {
    if (!val && problem.detail) return String(problem.detail);
    if (typeof val === "string") return val;
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (val && typeof val === "object" && "message" in (val as any)) {
      const m = (val as any).message;
      if (typeof m === "string") return m;
    }
    return problem.detail ?? "Neplatná data.";
  };

  let rootMsg: string | undefined;

  for (const [rawKey, rawVal] of Object.entries(errs)) {
    const msg = toMessage(rawVal);

    // root/form-level chyby
    if (rawKey === "_form" || rawKey === "" || rawKey === undefined) {
      rootMsg = msg;
      continue;
    }

    // RHF: použijeme dot-notaci; typesafe cast na Path<TFieldValues>
    const key = rawKey as Path<TFieldValues>;
    setError(key, { type: "server", message: msg });
    applied++;
  }

  if (rootMsg) {
    // RHF root error (můžeš přečíst přes formState.errors.root?.message)
    setError("root" as any, { type: "server", message: rootMsg });
  }

  return { applied, unknown: applied === 0 ? problem.detail : undefined };
}
