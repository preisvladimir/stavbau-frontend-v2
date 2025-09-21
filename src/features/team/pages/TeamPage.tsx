import React from "react";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { TeamService } from "@/features/team/api/team.service";
import type { MemberDto, CompanyRole, CreateMemberRequest } from "@/lib/api/types";
import { ApiError } from "@/lib/api/problem";
import axios from "axios";



const ROLES: CompanyRole[] = ['OWNER','COMPANY_ADMIN','MANAGER','WORKER','VIEWER'];

export default function TeamPage() {
  const { t } = useTranslation("team");
  const { user } = useAuthContext();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<MemberDto[]>([]);

  // Add form state (MVP jednoduchý modal-less panel)
  const [showAdd, setShowAdd] = React.useState(false);
  const [addEmail, setAddEmail] = React.useState('');
  const [addRole, setAddRole] = React.useState<CompanyRole>('WORKER');
  const [addErrors, setAddErrors] = React.useState<Record<string, string>>({});

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


  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">{t("title")}</h1>

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
