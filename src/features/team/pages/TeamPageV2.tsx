import React from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import MemberEditModal from "@/features/team/components/MemberEditModal";
import { TeamService } from "@/features/team/api/team.service";
import type { MemberDto, CompanyRole } from "@/lib/api/types";
import { ApiError } from "@/lib/api/problem";
import { DataTableV2 } from "@/components/ui/stavbau-ui/datatable-v2";
import { Button } from "@/components/ui/stavbau-ui/button";
import { EmptyState } from "@/components/ui/stavbau-ui/emptystate";
import { SearchInput } from "@/components/ui/stavbau-ui/searchinput";
import { Mail, Shield, User as UserIcon, UserPlus, Pencil, Trash2, X } from "@/components/icons";
import { EMAIL_INPUT_PATTERN, EMAIL_REGEX } from "@/lib/utils/patterns";
import { useFab, Plus } from "@/components/layout";

/**
 * TeamPageV2 — plná integrace DataTableV2 (toolbar, paging, sorting, row actions)
 * - client-side filtrování (řízené přes DataTableV2.search)
 * - slot rowActions (Edit role, Edit profile, Delete) s RBAC přes ScopeGuard
 * - prázdné stavy i loading v souladu s UI kitem
 */
export default function TeamPageV2() {
  const { setFab } = useFab();
  const { user } = useAuthContext();
  const { t } = useTranslation("team");

  const [items, setItems] = React.useState<MemberDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // search řízená z DataTableV2 toolbaru (PR4)
  const [search, setSearch] = React.useState("");

  // add form
  const [showAdd, setShowAdd] = React.useState(false);
  const [addEmail, setAddEmail] = React.useState("");
  const [addRole, setAddRole] = React.useState<CompanyRole | string>("MEMBER");
  const [addFirstName, setAddFirstName] = React.useState("");
  const [addLastName, setAddLastName] = React.useState("");
  const [addPhone, setAddPhone] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // update role (inline v tabulce)
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftRole, setDraftRole] = React.useState<CompanyRole | string>("VIEWER");
  const [updating, setUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  // edit profile modal
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<MemberDto | null>(null);

  // delete
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const companyId = user?.companyId;

  const ALL_ROLES: CompanyRole[] = React.useMemo(
    () => [
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
    ],
    []
  );

  const VISIBLE_ROLES: CompanyRole[] = React.useMemo(
    () => ALL_ROLES.filter((r) => r !== "OWNER" && r !== "SUPERADMIN"),
    [ALL_ROLES]
  );

  const canEditMemberRole = (m: MemberDto) => m.role !== "OWNER";
  const roleLabel = (r: CompanyRole | string) => t(`roles.${r}`, { defaultValue: r });
  const validateEmail = (email: string) => EMAIL_REGEX.test(email.trim());

  // fetch list
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
        const isAxiosCanceled =
          (axios.isAxiosError?.(e) && e.code === "ERR_CANCELED") ||
          (typeof (axios as any).isCancel === "function" && (axios as any).isCancel(e)) ||
          (e as any)?.message === "canceled" ||
          (e as any)?.name === "CanceledError" ||
          (e as any)?.name === "AbortError";
        const isApiErrorCanceled =
          e instanceof ApiError && (e.problem.status === 0 || /cancel|abort/i.test(e.problem.title || "") || /cancel|abort/i.test(e.message || ""));
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

  // add submit
  const onAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setAddError(null);
    setFieldErrors({});

    if (!addEmail.trim() || !validateEmail(addEmail)) {
      setFieldErrors((fe) => ({ ...fe, email: t("validation.email", { defaultValue: "Zadejte platný e-mail" }) as string }));
      return;
    }
    if (!addRole) {
      setFieldErrors((fe) => ({ ...fe, role: t("validation.role", { defaultValue: "Vyberte roli" }) as string }));
      return;
    }
    if (addRole === "OWNER" || addRole === "SUPERADMIN") {
      setFieldErrors((fe) => ({
        ...fe,
        role:
          (addRole === "OWNER"
            ? t("errors.ownerAssignForbidden", { defaultValue: "Roli OWNER nelze přiřadit." })
            : t("errors.notAssignable", { defaultValue: "Roli SUPERADMIN nelze v tomto rozhraní přiřadit." })) as string,
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
      setItems((prev) => [created, ...prev]);
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
            t("errors.forbiddenAdd", { defaultValue: "Nemáte oprávnění přidávat členy (vyžaduje scope team:write)." })
          );
          return;
        }
        if (e.problem.status === 409) {
          setAddError(
            t("errors.conflictMember", { defaultValue: "Uživatel už ve firmě existuje nebo je přiřazen k jiné firmě." })
          );
          return;
        }
        const errs = (e.problem.errors ?? {}) as Record<string, any>;
        if (e.problem.status === 400 && errs && Object.keys(errs).length > 0) {
          const mapped: Record<string, string> = {};
          for (const k of Object.keys(errs)) {
            const v = errs[k];
            mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
          }
          setFieldErrors(mapped);
          setAddError(t("errors.validation", { defaultValue: "Zkontrolujte zvýrazněná pole." }));
          return;
        }
        setAddError(
          e.problem.detail || e.problem.title || (t("error", { defaultValue: "Nepodařilo se uložit." }) as string)
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

  // edit role helpers
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
    const member = items.find((it) => it.id === editingId);
    if (member && member.role === draftRole) {
      setEditingId(null);
      return;
    }
    if (String(draftRole) === "SUPERADMIN") {
      setUpdateError(t("errors.notAssignable", { defaultValue: "Roli SUPERADMIN nelze v tomto rozhraní přiřadit." }));
      return;
    }
    if (String(draftRole) === "OWNER") {
      setUpdateError(t("errors.ownerAssignForbidden", { defaultValue: "Roli OWNER nelze přiřadit." }));
      return;
    }

    setUpdating(true);
    setUpdateError(null);
    try {
      const updated = await TeamService.updateMemberRole(companyId, editingId, { role: draftRole });
      setItems((prev) => prev.map((it) => (it.id === editingId ? { ...it, role: updated.role } : it)));
      setEditingId(null);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.problem.status === 403) {
          setUpdateError(t("errors.ownerChangeForbidden", { defaultValue: "Nelze měnit roli vlastníka." }));
          return;
        } else if (e.problem.status === 409) {
          setUpdateError(t("errors.conflictUpdateRole", { defaultValue: "Nelze změnit roli – došlo ke konfliktu." }));
        } else if (e.problem.status === 400) {
          const fe = (e.problem.errors ?? {}) as Record<string, any>;
          const roleMsg = fe?.role ? (Array.isArray(fe.role) ? String(fe.role[0]) : String(fe.role)) : null;
          setUpdateError(
            roleMsg || e.problem.detail || e.problem.title || (t("error", { defaultValue: "Nepodařilo se uložit." }) as string)
          );
        } else {
          setUpdateError(
            e.problem.detail || e.problem.title || (t("error", { defaultValue: "Nepodařilo se uložit." }) as string)
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

  // delete
  const handleDelete = async (m: MemberDto) => {
    if (!companyId) return;
    setDeleteError(null);
    const isOwner = m.role === "OWNER";
    if (isOwner) {
      const ownerCount = items.filter((x) => x.role === "OWNER").length;
      if (ownerCount <= 1) {
        setDeleteError(t("errors.lastOwner", { defaultValue: "Nelze odebrat posledního vlastníka." }) as string);
        return;
      }
    }
    const ok = window.confirm(
      t("confirm.delete.body", { defaultValue: "Opravdu chcete odebrat tohoto člena?" }) as string
    );
    if (!ok) return;
    setDeletingId(m.id);
    try {
      await TeamService.remove(companyId, m.id);
      setItems((prev) => prev.filter((it) => it.id !== m.id));
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.problem.status === 403) {
          setDeleteError(
            t("errors.forbiddenDelete", {
              defaultValue: "Nemáte oprávnění odebrat člena nebo jde o posledního vlastníka.",
            }) as string
          );
        } else if (e.problem.status === 404) {
          setDeleteError(t("errors.memberNotFound", { defaultValue: "Člen nenalezen." }) as string);
        } else {
          setDeleteError(
            e.problem.detail || e.problem.title || (t("error", { defaultValue: "Operaci se nepodařilo dokončit." }) as string)
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
  };

  // klientský filtr nad items podle search
  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((m) => {
      const name = [m.firstName, m.lastName].filter(Boolean).join(" ");
      const roleText = String(m.role ?? "");
      return (
        m.email?.toLowerCase().includes(needle) ||
        name.toLowerCase().includes(needle) ||
        (m.phone ?? "").toLowerCase().includes(needle) ||
        roleText.toLowerCase().includes(needle)
      );
    });
  }, [items, search]);

  // Empty state (kontextově)
  const emptyNode = search ? (
    <EmptyState
      title={t("emptyFilteredTitle", { defaultValue: "Žádné výsledky" }) as string}
      description={t("emptyFilteredDesc", { defaultValue: "Upravte filtr nebo jej vymažte." }) as string}
      action={
        <Button variant="outline" leftIcon={<X size={16} />} onClick={() => setSearch("")}>
          {t("actions.clearFilter", { defaultValue: "Vymazat filtr" })}
        </Button>
      }
    />
  ) : (
    <EmptyState
      title={t("emptyTitle", { defaultValue: "Žádní uživatelé" }) as string}
      description={t("emptyDesc", { defaultValue: "Zatím jste nepřidal žádného uživatele." }) as string}
      action={
        <ScopeGuard anyOf={["team:write", "team:add"]}>
          <Button leftIcon={<UserPlus size={16} />} onClick={() => setShowAdd((s) => !s)}>
            {t("actions.createUser", { defaultValue: "Vytvořit" })}
          </Button>
        </ScopeGuard>
      }
    />
  );

  // FAB
  React.useEffect(() => {
    setFab({ label: "Nový Uživatel", onClick: () => setShowAdd((s) => !s), icon: <Plus className="h-6 w-6" /> });
    return () => setFab(null);
  }, [setFab]);

  // --- Columns for DataTableV2 ---
  const columns = React.useMemo(() => [
    {
      id: "avatar",
      header: "",
      accessor: (_m: MemberDto) => "", // headless; cell níže
      cell: () => (
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <UserIcon size={16} />
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "email",
      header: t("columns.email"),
      accessor: (m: MemberDto) => m.email,
      cell: (m: MemberDto) => (
        <span className="inline-flex items-center gap-1">
          <Mail size={14} /> {m.email}
        </span>
      ),
    },
    {
      id: "role",
      header: t("columns.role"),
      accessor: (m: MemberDto) => m.role,
      cell: (m: MemberDto) =>
        editingId === m.id ? (
          <select
            className="rounded-lg border border-gray-300 px-2 py-1"
            value={draftRole}
            onChange={(e) => setDraftRole(e.target.value)}
            disabled={updating}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                void submitEditRole();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                cancelEditRole();
              }
            }}
          >
            {VISIBLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Shield size={14} /> {roleLabel(m.role)}
          </span>
        ),
    },
    // inline error řádek pro editovaný záznam
    {
      id: "roleError",
      header: "",
      accessor: (_m: MemberDto) => "",
      enableSorting: false,
      cell: (m: MemberDto) => (m.id === editingId && updateError ? (
        <div className="text-xs text-red-600 mt-1">{updateError}</div>
      ) : null),
    },
    {
      id: "name",
      header: t("columns.name"),
      accessor: (m: MemberDto) => [m.firstName, m.lastName].filter(Boolean).join(" ") || "—",
    },
    {
      id: "phone",
      header: t("columns.phone"),
      accessor: (m: MemberDto) => m.phone || "—",
    },
  ], [t, editingId, draftRole, updateError, updating]);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between gap-2 md:gap-4">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto min-w-0">
          <SearchInput
            preset="v1"
            value={search}
            onChange={setSearch}
            leftIcon="search"
            clearable
            className="w-full md:max-w-lg"
            placeholder={t("search.placeholder", { defaultValue: "Hledat e-mail, jméno, telefon…" }) as string}
            ariaLabel={t("search.aria", { defaultValue: "Hledat v uživatelích" }) as string}
          />
          <ScopeGuard anyOf={["team:write", "team:add"]}>
            <Button
              type="button"
              onClick={() => setShowAdd((s) => !s)}
              disabled={loading}
              ariaLabel={t("actions.newUser", { defaultValue: "Nový uživatel" }) as string}
              leftIcon={<UserPlus size={16} />}
              className="shrink-0 whitespace-nowrap"
            >
              <span>{t("actions.newUser", { defaultValue: "Nový uživatel" })}</span>
            </Button>
          </ScopeGuard>
        </div>
      </div>

      {/* Inline add panel */}
      <ScopeGuard anyOf={["team:write", "team:add"]}>
        {showAdd && (
          <form onSubmit={onAddSubmit} className="mb-4 rounded-xl border border-gray-200 p-3 space-y-3">
            {addError && (
              <div role="alert" className="text-red-600">{addError}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("form.email", { defaultValue: "E-mail" })}</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addEmail}
                  pattern={EMAIL_INPUT_PATTERN}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                {fieldErrors.email && <div className="text-xs text-red-600 mt-1">{fieldErrors.email}</div>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("form.firstName", { defaultValue: "Jméno" })}</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  placeholder={t("placeholders.firstName", { defaultValue: "Jan" }) as string}
                />
                {fieldErrors.firstName && <div className="text-xs text-red-600 mt-1">{fieldErrors.firstName}</div>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("form.lastName", { defaultValue: "Příjmení" })}</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addLastName}
                  onChange={(e) => setAddLastName(e.target.value)}
                  placeholder={t("placeholders.lastName", { defaultValue: "Novák" }) as string}
                />
                {fieldErrors.lastName && <div className="text-xs text-red-600 mt-1">{fieldErrors.lastName}</div>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("form.role", { defaultValue: "Role" })}</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                >
                  {VISIBLE_ROLES.map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
                {fieldErrors.role && <div className="text-xs text-red-600 mt-1">{fieldErrors.role}</div>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("form.phone", { defaultValue: "Telefon" })}</label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="420 123 456 789"
                />
                {fieldErrors.phone && <div className="text-xs text-red-600 mt-1">{fieldErrors.phone}</div>}
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" isLoading={adding}>{t("actions.add", { defaultValue: "Přidat" })}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowAdd(false); setAddError(null); setFieldErrors({}); }}>
                  {t("actions.cancel", { defaultValue: "Zrušit" })}
                </Button>
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

      {/* DataTableV2 — toolbar + paging + sorting + actions */}
      <DataTableV2<MemberDto>
        variant="surface"
        className="mt-2"
        data={filtered}
        columns={columns}
        keyField={(m) => m.id}
        loading={loading}
        // Toolbar (PR4/4.1)
        search={search}
        onSearchChange={setSearch}
        defaultDensity="cozy"
        pageSizeOptions={[5, 10, 20]}
        showToolbar={true} // toolbar řeší stránka, aby layout odpovídal původnímu designu
        // Pager (PR3) — klientský režim (enableClientPaging default true)
        showPager
        // Row actions (PR5)
        rowActions={(m) => (
          <>
            <ScopeGuard anyOf={["team:write", "team:update_role"]}>
              {editingId === m.id ? (
                <>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); void submitEditRole(); }} isLoading={updating}>
                    {t("actions.save", { defaultValue: "Uložit" })}
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); cancelEditRole(); }} disabled={updating}>
                    {t("actions.cancel", { defaultValue: "Zrušit" })}
                  </Button>
                </>
              ) : canEditMemberRole(m) ? (
                <Button
                  size="sm"
                  variant="outline"
                  ariaLabel={t("actions.editRole", { defaultValue: "Upravit roli" }) as string}
                  leftIcon={<Pencil size={16} />}
                  onClick={(e) => { e.stopPropagation(); beginEditRole(m); }}
                  title={t("actions.editRole", { defaultValue: "Upravit roli" }) as string}
                />
              ) : null}
            </ScopeGuard>

            <ScopeGuard anyOf={["team:write", "team:update"]}>
              <Button
                size="sm"
                variant="outline"
                ariaLabel={t("actions.editProfile", { defaultValue: "Upravit profil" }) as string}
                leftIcon={<UserIcon size={16} />}
                onClick={(e) => { e.stopPropagation(); setSelectedMember(m); setEditProfileOpen(true); }}
                title={t("actions.editProfile", { defaultValue: "Upravit profil" }) as string}
              />
            </ScopeGuard>

            <ScopeGuard anyOf={["team:write", "team:remove"]}>
              <Button
                size="sm"
                variant="danger"
                ariaLabel={t("actions.delete", { defaultValue: "Odebrat" }) as string}
                leftIcon={<Trash2 size={16} />}
                onClick={(e) => { e.stopPropagation(); void handleDelete(m); }}
                isLoading={deletingId === m.id}
                title={t("actions.delete", { defaultValue: "Odebrat" }) as string}
              />
            </ScopeGuard>
            {deletingId === m.id && deleteError && (
              <div className="text-xs text-red-600">{deleteError}</div>
            )}
          </>
        )}
        // Empty state
        emptyContent={emptyNode}
      />

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
