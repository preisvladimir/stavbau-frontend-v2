import React from "react";
import { useTranslation } from "react-i18next";
import type { MemberDto } from "@/lib/api/types";
import { TeamService } from "@/features/team/api/team.service";
import { ApiError } from "@/lib/api/problem";

type Props = {
  open: boolean;
  companyId: string;
  member: MemberDto | null;
  onClose: () => void;
  onSaved: (updated: MemberDto) => void;
};

export default function MemberEditModal({ open, companyId, member, onClose, onSaved }: Props) {
  const { t } = useTranslation("team");
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open && member) {
      setFirstName(member.firstName ?? "");
      setLastName(member.lastName ?? "");
      setPhone(member.phone ?? "");
      setError(null);
      setFieldErrors({});
    }
  }, [open, member]);

  if (!open || !member) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const updated = await TeamService.update(companyId, member.id, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        phone: phone.trim() || null,
        // role NEPOSÍLÁME – role se řeší separátně přes updateMemberRole
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.problem.status === 403) {
          setError(t("errors.forbiddenUpdateProfile", {
            defaultValue: "Nemáte oprávnění upravovat profil člena.",
          }) as string);
        } else if (e.problem.status === 400 && e.problem.errors) {
          const errs = e.problem.errors as Record<string, any>;
          const mapped: Record<string, string> = {};
          for (const k of Object.keys(errs)) {
            const v = errs[k];
            mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
          }
          setFieldErrors(mapped);
          setError(t("errors.validation", { defaultValue: "Zkontrolujte zvýrazněná pole." }) as string);
        } else if (e.problem.status === 404) {
          setError(t("errors.memberNotFound", { defaultValue: "Člen nenalezen." }) as string);
        } else {
          setError(e.problem.detail || e.problem.title || (t("error", { defaultValue: "Nepodařilo se uložit." }) as string));
        }
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("editModal.title", { defaultValue: "Upravit profil člena" })}</h2>
          <button onClick={onClose} className="px-2 py-1 rounded-md border border-gray-300">{t("actions.close", { defaultValue: "Zavřít" })}</button>
        </div>

        {error && <div role="alert" className="mb-3 text-red-600">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("form.firstName", { defaultValue: "Jméno" })}</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t("placeholders.firstName", { defaultValue: "Jan" }) as string}
              />
              {fieldErrors.firstName && <div className="text-xs text-red-600 mt-1">{fieldErrors.firstName}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("form.lastName", { defaultValue: "Příjmení" })}</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t("placeholders.lastName", { defaultValue: "Novák" }) as string}
              />
              {fieldErrors.lastName && <div className="text-xs text-red-600 mt-1">{fieldErrors.lastName}</div>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("form.phone", { defaultValue: "Telefon" })}</label>
            <input
              type="tel"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="420 123 456 789"
            />
            {fieldErrors.phone && <div className="text-xs text-red-600 mt-1">{fieldErrors.phone}</div>}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-gray-300">
              {t("actions.cancel", { defaultValue: "Zrušit" })}
            </button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-black text-white disabled:opacity-50">
              {saving ? t("actions.saving", { defaultValue: "Ukládám…" }) : t("actions.save", { defaultValue: "Uložit" })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
