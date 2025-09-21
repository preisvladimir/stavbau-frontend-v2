import React from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import MemberEditModal from "@/features/team/components/MemberEditModal";
import { TeamService } from "@/features/team/api/team.service";
import type { MemberDto, CompanyRole } from "@/lib/api/types";
import { ApiError } from "@/lib/api/problem";
// import { EMAIL_REGEX, EMAIL_REGEX_INPUT } from "@/lib/utils/regex";

export default function TeamPage() {
  const { user } = useAuthContext();
  const { t } = useTranslation("team");
  const [items, setItems] = React.useState<MemberDto[]>([]);

  // jednotný seznam všech rolí podle BE
  const ALL_ROLES: CompanyRole[] = [
    "OWNER",
    "COMPANY_ADMIN",
    "ACCOUNTANT",
    "PURCHASING",
    "MANAGER",
    "DOC_CONTROLLER",
    "FLEET_MANAGER",
    "HR_MANAGER",
    "AUDITOR_READONLY",
    "INTEGRATION",
    "MEMBER",
    "VIEWER",
    "SUPERADMIN",
  ];
  const roleLabel = (r: CompanyRole | string) =>
    t(`roles.${r}`, { defaultValue: r });

  // --- FE pre-guard helpers ---
  /** V tenant UI NIKDY nenabízíme OWNER ani SUPERADMIN v selectech */
  const VISIBLE_ROLES: CompanyRole[] = React.useMemo(
    () => ALL_ROLES.filter((r) => r !== "OWNER" && r !== "SUPERADMIN"),
    []
  );
  /** OWNER nelze editovat */
  const canEditMemberRole = (member: MemberDto) => member.role !== "OWNER";

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Add form state
  const [showAdd, setShowAdd] = React.useState(false);
  const [addEmail, setAddEmail] = React.useState("");
  const [addRole, setAddRole] = React.useState<CompanyRole | string>("MEMBER");
  const [addFirstName, setAddFirstName] = React.useState("");
  const [addLastName, setAddLastName] = React.useState("");
  const [addPhone, setAddPhone] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  );

  // Update role state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftRole, setDraftRole] = React.useState<CompanyRole | string>("VIEWER");
  const [updating, setUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  // Edit profile modal state
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<MemberDto | null>(null);

  // Delete member state
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

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
        setItems(res?.items ?? []);
      } catch (e) {
        // Ignoruj zrušené požadavky (Axios/Abort/ApiError-canceled)
        const isAxiosCanceled =
          (axios.isAxiosError?.(e) && e.code === "ERR_CANCELED") ||
          (typeof (axios as any).isCancel === "function" &&
            (axios as any).isCancel(e)) ||
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
  // minimální, tolerantní validátor (alespoň něco@něco.domena)
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const validateEmail = (email: string) => emailRe.test(email.trim());

  const onAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setAddError(null);
    setFieldErrors({});

    // FE validace
    if (!addEmail.trim() || !validateEmail(addEmail)) {
      setFieldErrors((fe) => ({
        ...fe,
        email: t("validation.email", {
          defaultValue: "Zadejte platný e-mail",
        }) as string,
      }));
      return;
    }
    if (!addRole) {
      setFieldErrors((fe) => ({
        ...fe,
        role: t("validation.role", { defaultValue: "Vyberte roli" }) as string,
      }));
      return;
    }
    // BE-aligned guard: nikdy nepřidávej OWNER/SUPERADMIN
    if (addRole === "OWNER" || addRole === "SUPERADMIN") {
      setFieldErrors((fe) => ({
        ...fe,
        role:
          (addRole === "OWNER"
            ? t("errors.ownerAssignForbidden", {
              defaultValue: "Roli OWNER nelze přiřadit.",
            })
            : t("errors.notAssignable", {
              defaultValue:
                "Roli SUPERADMIN nelze v tomto rozhraní přiřadit.",
            })) as string,
      }));
      return;
    }

    setAdding(true);
    try {
      const created = await TeamService.add(companyId, {
        email: addEmail.trim(),
        role: addRole,
        firstName: addFirstName.trim() || null,
        lastName: addLastName.trim() || null,
        phone: addPhone.trim() || null,
      });
      // optimistické doplnění do listu
      setItems((prev) => [created, ...prev]);
      // reset formuláře
      setAddEmail("");
      setAddRole("MEMBER");
      setAddFirstName("");
      setAddLastName("");
      setAddPhone("");
      setShowAdd(false);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.problem.status === 403) {
          setAddError(
            t("errors.forbiddenAdd", {
              defaultValue:
                "Nemáte oprávnění přidávat členy (vyžaduje scope team:write).",
            })
          );
          return;
        }
        if (e.problem.status === 409) {
          setAddError(
            t("errors.conflictMember", {
              defaultValue:
                "Uživatel už ve firmě existuje nebo je přiřazen k jiné firmě.",
            })
          );
          return;
        }
        // 400 Validation: zkusíme vytáhnout field-errors
        const errs = (e.problem.errors ?? {}) as Record<string, any>;
        if (e.problem.status === 400 && errs && Object.keys(errs).length > 0) {
          const mapped: Record<string, string> = {};
          for (const k of Object.keys(errs)) {
            const v = errs[k];
            mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
          }
          setFieldErrors(mapped);
          setAddError(
            t("errors.validation", {
              defaultValue: "Zkontrolujte zvýrazněná pole.",
            })
          );
          return;
        }
        // fallback
        setAddError(
          e.problem.detail ||
          e.problem.title ||
          (t("error", { defaultValue: "Nepodařilo se uložit." }) as string)
        );
      } else if (e instanceof Error) {
        setAddError(e.message);
      } else {
        setAddError(String(e));
      }
    }
  };

  // === Update role handlers ===
  const beginEditRole = (m: MemberDto) => {
    setEditingId(m.id);
    setDraftRole(m.role || "VIEWER");
    setUpdateError(null);
  };

  const cancelEditRole = () => {
    setEditingId(null);
    setUpdateError(null);
  };

  const submitEditRole = async () => {
    if (!companyId || !editingId) return;
    if (!draftRole) {
      setUpdateError(t("validation.role", { defaultValue: "Vyberte roli" }));
      return;
    }

    // najdi editovaného člena
    const member = items.find((it) => it.id === editingId);

    // 1) No-op (žádná změna)
    if (member && member.role === draftRole) {
      setEditingId(null);
      return;
    }

    // 2) SUPERADMIN ani OWNER nelze nastavit v tenant UI (obrana proti DOM hacku)
    if (String(draftRole) === "SUPERADMIN") {
      setUpdateError(
        t("errors.notAssignable", {
          defaultValue: "Roli SUPERADMIN nelze v tomto rozhraní přiřadit.",
        })
      );
      return;
    }
    if (String(draftRole) === "OWNER") {
      setUpdateError(
        t("errors.ownerAssignForbidden", {
          defaultValue: "Roli OWNER nelze přiřadit.",
        })
      );
      return;
    }

    setUpdating(true);
    setUpdateError(null);
    try {
      const updated = await TeamService.updateMemberRole(companyId, editingId, {
        role: draftRole,
      });
      // Optimisticky přepiš v lokálním seznamu
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingId ? { ...it, role: updated.role } : it
        )
      );
      setEditingId(null);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.problem.status === 403) {
          // BE zakazuje změnu role vlastníka (OWNER) – ukaž dedikovanou hlášku
          setUpdateError(
            t("errors.ownerChangeForbidden", {
              defaultValue: "Nelze měnit roli vlastníka.",
            })
          );
          return;
        } else if (e.problem.status === 409) {
          setUpdateError(
            t("errors.conflictUpdateRole", {
              defaultValue: "Nelze změnit roli – došlo ke konfliktu.",
            })
          );
        } else if (e.problem.status === 400) {
          const fe = (e.problem.errors ?? {}) as Record<string, any>;
          const roleMsg = fe?.role
            ? Array.isArray(fe.role)
              ? String(fe.role[0])
              : String(fe.role)
            : null;
          setUpdateError(
            roleMsg ||
            e.problem.detail ||
            e.problem.title ||
            (t("error", { defaultValue: "Nepodařilo se uložit." }) as string)
          );
        } else {
          setUpdateError(
            e.problem.detail ||
            e.problem.title ||
            (t("error", { defaultValue: "Nepodařilo se uložit." }) as string)
          );
        }
      } else if (e instanceof Error) {
        setUpdateError(e.message);
      } else {
        setUpdateError(String(e));
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <ScopeGuard anyOf={["team:write", "team:add"]}>
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
      <ScopeGuard anyOf={["team:write", "team:add"]}>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("form.email", { defaultValue: "E-mail" })}
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addEmail}
                  pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                {fieldErrors.email && (
                  <div className="text-xs text-red-600 mt-1">
                    {fieldErrors.email}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("form.firstName", { defaultValue: "Jméno" })}
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  placeholder={
                    t("placeholders.firstName", { defaultValue: "Jan" }) as string
                  }
                />
                {fieldErrors.firstName && (
                  <div className="text-xs text-red-600 mt-1">
                    {fieldErrors.firstName}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("form.lastName", { defaultValue: "Příjmení" })}
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addLastName}
                  onChange={(e) => setAddLastName(e.target.value)}
                  placeholder={
                    t("placeholders.lastName", { defaultValue: "Novák" }) as string
                  }
                />
                {fieldErrors.lastName && (
                  <div className="text-xs text-red-600 mt-1">
                    {fieldErrors.lastName}
                  </div>
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
                  {VISIBLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
                {fieldErrors.role && (
                  <div className="text-xs text-red-600 mt-1">
                    {fieldErrors.role}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("form.phone", { defaultValue: "Telefon" })}
                </label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="420 123 456 789"
                />
                {fieldErrors.phone && (
                  <div className="text-xs text-red-600 mt-1">
                    {fieldErrors.phone}
                  </div>
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
          {t("error")}{" "}
          {process.env.NODE_ENV !== "production" ? `(${error})` : null}
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
                <th className="text-left p-2 border-b w-40">
                  {t("columns.actions", { defaultValue: "Akce" })}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => {
                const name =
                  [m.firstName, m.lastName].filter(Boolean).join(" ") || "—";
                return (
                  <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border-b">{m.email}</td>
                    <td className="p-2 border-b">
                      {editingId === m.id ? (
                        <select
                          className="rounded-lg border border-gray-300 px-2 py-1"
                          value={draftRole}
                          onChange={(e) => setDraftRole(e.target.value)}
                          disabled={updating}
                        >
                          {VISIBLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        roleLabel(m.role)
                      )}
                      {editingId === m.id && updateError && (
                        <div className="text-xs text-red-600 mt-1">
                          {updateError}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-b">{name}</td>
                    <td className="p-2 border-b">{m.phone || "—"}</td>
                    <td className="p-2 border-b">
                      <ScopeGuard anyOf={["team:write", "team:update_role"]}>
                        {editingId === m.id ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="px-2 py-1 rounded-lg bg-black text-white disabled:opacity-50"
                              onClick={submitEditRole}
                              disabled={updating}
                            >
                              {updating
                                ? t("actions.saving", {
                                  defaultValue: "Ukládám…",
                                })
                                : t("actions.save", { defaultValue: "Uložit" })}
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 rounded-lg border border-gray-300"
                              onClick={cancelEditRole}
                              disabled={updating}
                            >
                              {t("actions.cancel", { defaultValue: "Zrušit" })}
                            </button>
                          </div>
                        ) : canEditMemberRole(m) ? (
                          <button
                            type="button"
                            className="px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
                            onClick={() => beginEditRole(m)}
                          >
                            {t("actions.editRole", {
                              defaultValue: "Upravit roli",
                            })}
                          </button>
                        ) : (
                          <span className="text-slate-400">
                            {t("errors.ownerChangeForbidden", {
                              defaultValue: "Nelze měnit roli vlastníka.",
                            })}
                          </span>
                        )}
                      </ScopeGuard>
                      {/* Edit profile action (nezávisle na roli člena) */}
                      <ScopeGuard anyOf={["team:write", "team:update"]}>
                        <button
                          type="button"
                          className="ml-2 px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            setSelectedMember(m);
                            setEditProfileOpen(true);
                          }}
                        >
                          {t("actions.editProfile", { defaultValue: "Upravit profil" })}
                        </button>
                      </ScopeGuard>
                      {/* Delete action */}
                      <ScopeGuard anyOf={["team:write", "team:remove"]}>
                        <button
                          type="button"
                          className="ml-2 px-2 py-1 rounded-lg border border-red-300 hover:bg-red-50 text-red-700 disabled:opacity-50"
                          onClick={async () => {
                            if (!companyId) return;
                            setDeleteError(null);
                            // volitelný FE guard: zkuste neodstraňovat posledního OWNERa (BE to stejně hlídá)
                            const isOwner = m.role === "OWNER";
                            if (isOwner) {
                              const ownerCount = items.filter(x => x.role === "OWNER").length;
                              if (ownerCount <= 1) {
                                setDeleteError(t("errors.lastOwner", { defaultValue: "Nelze odebrat posledního vlastníka." }) as string);
                                return;
                              }
                            }
                            const ok = window.confirm(
                              t("confirm.delete.body", {
                                defaultValue: "Opravdu chcete odebrat tohoto člena?",
                              }) as string
                            );
                            if (!ok) return;
                            setDeletingId(m.id);
                            try {
                              await TeamService.remove(companyId, m.id);
                              setItems(prev => prev.filter(it => it.id !== m.id));
                            } catch (e) {
                              if (e instanceof ApiError) {
                                if (e.problem.status === 403) {
                                  setDeleteError(
                                    t("errors.forbiddenDelete", {
                                      defaultValue: "Nemáte oprávnění odebrat člena nebo jde o posledního vlastníka.",
                                    }) as string
                                  );
                                } else if (e.problem.status === 404) {
                                  setDeleteError(
                                    t("errors.memberNotFound", { defaultValue: "Člen nenalezen." }) as string
                                  );
                                } else {
                                  setDeleteError(
                                    e.problem.detail ||
                                    e.problem.title ||
                                    (t("error", { defaultValue: "Operaci se nepodařilo dokončit." }) as string)
                                  );
                                }
                              } else if (e instanceof Error) {
                                setDeleteError(e.message);
                              } else {
                                setDeleteError(String(e));
                              }
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId === m.id}
                          aria-busy={deletingId === m.id}
                        >
                          {deletingId === m.id
                            ? t("actions.removing", { defaultValue: "Odebírám…" })
                            : t("actions.delete", { defaultValue: "Odebrat" })}
                        </button>
                        {deleteError && deletingId === m.id && (
                          <div className="text-xs text-red-600 mt-1">{deleteError}</div>
                        )}
                      </ScopeGuard>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal pro úpravu profilu člena */}
      {companyId && (
        <MemberEditModal
          open={editProfileOpen}
          companyId={companyId}
          member={selectedMember}
          onClose={() => setEditProfileOpen(false)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)));
          }}
        />
      )}
    </div>
  );
}
