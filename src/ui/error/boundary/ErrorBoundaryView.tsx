// src/ui/error/boundary/ErrorBoundaryView.tsx
import { useNavigate, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../button";

type Props = {
  /** Volitelný HTTP/semantic kód (např. 404). Když nepředáš, vezme se z router erroru. */
  code?: number;
  /** Vlastní titulek; jinak se odvodí podle kódu */
  title?: string;
  /** Vlastní popis; jinak se odvodí podle kódu */
  description?: string;
  /** Kam poslat „Domů“; můžeš změnit dle app info architektury */
  homePath?: string;
  /** Zobrazit detail chyby (užitečné v dev) */
  showDetailsInDev?: boolean;
};

export default function ErrorBoundaryView({
  code,
  title,
  description,
  homePath = "/app/dashboard",
  showDetailsInDev = true,
}: Props) {
  const { t } = useTranslation(["errors", "common"]);
  const navigate = useNavigate();
  const routeErr = useRouteError();

  // --- Derivace status code / messages ---
  const { status, statusText, message, data } = parseRouteError(routeErr);
  const effectiveCode = code ?? status ?? 500;

  const { resolvedTitle, resolvedDesc } = resolveCopy({
    code: effectiveCode,
    title,
    description,
    statusText,
    message,
    t,
  });

  const isDev = process.env.NODE_ENV !== "production";
  const canShowDetails =
    !!showDetailsInDev &&
    !!isDev &&
    (!!message || data != null);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div
        role="alert"
        aria-live="assertive"
        className="w-full max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6"
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-semibold">
            {effectiveCode}
          </span>
          <h1 className="text-lg font-semibold text-amber-900">{resolvedTitle}</h1>
        </div>

        <p className="text-sm text-amber-800">
          {resolvedDesc}
        </p>

        {canShowDetails && (
          <details className="mt-3 rounded-lg border border-amber-200 bg-white p-3 text-xs text-slate-700">
            <summary className="cursor-pointer select-none text-amber-900">
              {t("errors:details", { defaultValue: "Detaily chyby" })}
            </summary>
            <div className="mt-2 space-y-2">
              {isNonEmpty(statusText) && (
                <div>
                  <strong>statusText:</strong> {statusText}
                </div>
              )}
              {isNonEmpty(message) && (
                <div>
                  <strong>message:</strong> {message}
                </div>
              )}
              {hasValue(data) && (
                <pre className="overflow-auto rounded bg-slate-50 p-2">
                  {safeStringify(data, 2)}
                </pre>
              )}
            </div>
          </details>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            {t("common:back", { defaultValue: "Zpět" })}
          </Button>
          <Button variant="secondary" onClick={() => navigate(homePath)}>
            {t("errors:go_home", { defaultValue: "Domů" })}
          </Button>
          <Button variant="primary" onClick={() => window.location.reload()}>
            {t("errors:try_again", { defaultValue: "Zkusit znovu" })}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------ helpers ------------------------ */
const isNonEmpty = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const hasValue = (v: unknown): boolean => v !== null && v !== undefined;

function parseRouteError(err: unknown): {
  status?: number;
  statusText?: string;
  message?: string;
  data?: unknown;
} {
  // react-router error responses (throw new Response(...))
  if (isRouteErrorResponse(err)) {
    return {
      status: err.status,
      statusText: err.statusText,
      // u loader/akcí bývá err.data = něco (JSON/objekt)
      data: (err as any).data,
    };
  }

  // běžný Error
  if (err instanceof Error) {
    return { message: err.message };
  }

  // cokoli jiného
  return { message: typeof err === "string" ? err : undefined, data: err };
}

function resolveCopy({
  code,
  title,
  description,
  statusText,
  message,
  t,
}: {
  code: number;
  title?: string;
  description?: string;
  statusText?: string;
  message?: string;
  t: (key: string, opts?: any) => string;
}) {
  const defaultTitle =
    code === 404
      ? t("errors:not_found_title", { defaultValue: "Stránka nenalezena" })
      : code === 401
        ? t("errors:unauthorized_title", { defaultValue: "Nepřihlášený přístup" })
        : code === 403
          ? t("errors:forbidden_title", { defaultValue: "Přístup zamítnut" })
          : t("errors:generic_title", { defaultValue: "Něco se pokazilo" });

  const defaultDesc =
    code === 404
      ? t("errors:not_found_desc", { defaultValue: "Zkontrolujte adresu nebo se vraťte na hlavní stránku." })
      : code === 401
        ? t("errors:unauthorized_desc", { defaultValue: "Pro pokračování se prosím přihlaste." })
        : code === 403
          ? t("errors:forbidden_desc", { defaultValue: "Nemáte potřebná oprávnění pro tuto akci." })
          : t("errors:generic_desc", { defaultValue: "Došlo k neočekávané chybě. Zkuste to prosím znovu." });

  return {
    resolvedTitle: title || defaultTitle,
    resolvedDesc: description || statusText || message || defaultDesc,
  };
}

function safeStringify(v: unknown, spaces = 2) {
  try {
    return JSON.stringify(v, null, spaces);
  } catch {
    return String(v);
  }
}
