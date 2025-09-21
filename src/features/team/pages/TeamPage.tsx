import React from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import { TeamService } from "@/features/team/api/team.service";
import type { MemberDto } from "@/lib/api/types";
import { ApiError } from "@/lib/api/problem";

export default function TeamPage() {
  const { t } = useTranslation("team");
  const { user } = useAuthContext();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<MemberDto[]>([]);

  // Add form state
  const [showAdd, setShowAdd] = React.useState(false);
  const [addEmail, setAddEmail] = React.useState("");
  const [addRole, setAddRole] = React.useState("VIEWER");
  const [adding, setAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});


  const companyId = user?.companyId;

  React.useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setItems([]);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await TeamService.list(companyId, { signal: ac.signal });
        // očekáváme MemberListResponse { items: MemberDto[] }
        console.log(res?.items ?? []);
        setItems(res?.items ?? []);
      } catch (e) {
        // Ignoruj zrušené požadavky (Axios/Abort/ApiError-canceled)
        const isAxiosCanceled =
          (axios.isAxiosError?.(e) && e.code === "ERR_CANCELED") ||
          (typeof (axios as any).isCancel === "function" && (axios as any).isCancel(e)) ||
          (e as any)?.message === "canceled" ||
          (e as any)?.name === "CanceledError" ||
          (e as any)?.name === "AbortError";
        const isApiErrorCanceled =
          e instanceof ApiError &&
          (e.problem.status === 0 ||
            /cancel|abort/i.test(e.problem.title || "") ||
            /cancel|abort/i.test(e.message || ""));
        if (isAxiosCanceled || isApiErrorCanceled) return;
        const message =
          e instanceof ApiError
            ? e.problem.detail || e.problem.title || "Request failed"
            : e instanceof Error
              ? e.message
              : String(e);
        setError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [companyId]);

  // === Add member algorithm ===
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setAddError(null);
    setFieldErrors({});
    // FE validace
    if (!addEmail.trim() || !validateEmail(addEmail)) {
      setFieldErrors((fe) => ({ ...fe, email: t("validation.email", { defaultValue: "Zadejte platný e-mail" }) }));
      return;
    }
    if (!addRole) {
      setFieldErrors((fe) => ({ ...fe, role: t("validation.role", { defaultValue: "Vyberte roli" }) }));
      return;
    }
    setAdding(true);
    try {
      const created = await TeamService.add(companyId, {
        email: addEmail.trim(),
        role: addRole,
      });
      // optimistické doplnění do listu
      setItems((prev) => [created, ...prev]);
      // reset formuláře
      setAddEmail("");
      setAddRole("VIEWER");
      setShowAdd(false);
    } catch (e) {
      if (e instanceof ApiError) {
        // Field errors z BE (pokud přijdou)
        const errs = (e.problem.errors ?? {}) as Record<string, any>;
        const mapped: Record<string, string> = {};
        if (errs) {
          for (const k of Object.keys(errs)) {
            const v = errs[k];
            mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
          }
          setFieldErrors(mapped);
        }
        setAddError(
          e.problem.detail || e.problem.title || t("error", { defaultValue: "Nepodařilo se uložit." })
        );
      } else if (e instanceof Error) {
        setAddError(e.message);
      } else {
        setAddError(String(e));
      }
    } finally {
      setAdding(false);
    }
  };


  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">{t("title")}</h1>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <ScopeGuard required={["team:write"]}>
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            onClick={() => setShowAdd((s) => !s)}
            disabled={loading}
          >
            {t("actions.newUser", { defaultValue: "Nový uživatel" })}
          </button>
        </ScopeGuard>
      </div>

      {/* Inline add panel */}
      <ScopeGuard required={["team:write"]}>
        {showAdd && (
          <form
            onSubmit={onAddSubmit}
            className="mb-4 rounded-xl border border-gray-200 p-3 space-y-3"
          >
            {addError && (
              <div role="alert" className="text-red-600">
                {addError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("form.email", { defaultValue: "E-mail" })}
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                {fieldErrors.email && (
                  <div className="text-xs text-red-600 mt-1">{fieldErrors.email}</div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("form.role", { defaultValue: "Role" })}
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                >
                  {/* Company role z BE – základní výběr; i18n labely doplníme v PR 5/N */}
                  <option value="VIEWER">{t("roles.VIEWER", { defaultValue: "Viewer" })}</option>
                  <option value="COMPANY_ADMIN">{t("roles.COMPANY_ADMIN", { defaultValue: "Company admin" })}</option>
                  <option value="OWNER">{t("roles.OWNER", { defaultValue: "Owner" })}</option>
                </select>
                {fieldErrors.role && (
                  <div className="text-xs text-red-600 mt-1">{fieldErrors.role}</div>
                )}
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-black text-white disabled:opacity-50"
                  disabled={adding}
                >
                  {adding
                    ? t("actions.saving", { defaultValue: "Ukládám…" })
                    : t("actions.add", { defaultValue: "Přidat" })}
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-gray-300"
                  onClick={() => {
                    setShowAdd(false);
                    setAddError(null);
                    setFieldErrors({});
                  }}
                >
                  {t("actions.cancel", { defaultValue: "Zrušit" })}
                </button>
              </div>
            </div>
          </form>
        )}
      </ScopeGuard>

      {loading && <div>{t("loading", { defaultValue: "Načítám…" })}</div>}

      {!loading && error && (
        <div role="alert" className="text-red-600">
          {t("error")} {process.env.NODE_ENV !== "production" ? `(${error})` : null}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-slate-600">{t("empty")}</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">{t("columns.email")}</th>
                <th className="text-left p-2 border-b">{t("columns.role")}</th>
                <th className="text-left p-2 border-b">{t("columns.name")}</th>
                <th className="text-left p-2 border-b">{t("columns.phone")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => {
                const name =
                  [m.firstName, m.lastName].filter(Boolean).join(" ") || "—";
                return (
                  <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border-b">{m.email}</td>
                    <td className="p-2 border-b">{m.role}</td>
                    <td className="p-2 border-b">{name}</td>
                    <td className="p-2 border-b">{m.phone || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
