// src/app/components/Sidebar.tsx
import * as React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { hasScope } from "@/features/auth/utils/hasScope";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";

export default function Sidebar() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const scopes = user?.scopes ?? [];

  const canReadProjects = hasScope(scopes, "projects:read", "anyOf");
  const canReadTeam = hasScope(scopes, "team:read", "anyOf");

  // Base vzhled odkazů
  const linkBase =
    "relative block rounded-lg text-sm transition-colors " +
    "px-3 py-2 pl-5 " + // pl-5 kvůli místu pro levou „stick“ indikaci
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black " +
    // pseudo-element pro levou „stick“ indikační lištu (je tam vždy; měníme jen opacitu/barvu)
    'before:content-[""] before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 ' +
    "before:h-5 before:w-1 before:rounded-full before:transition-opacity before:duration-150";

  const linkInactive =
    "text-[rgb(var(--sb-fg))] hover:bg-[rgba(var(--sb-border)/0.25)] " +
    "before:bg-[rgb(var(--sb-border))] before:opacity-0 hover:before:opacity-60";

  const linkActive =
    "bg-[rgba(var(--sb-border)/0.35)] text-[rgb(var(--sb-fg))] font-medium " +
    "before:bg-[rgb(var(--sb-fg))] before:opacity-100";

  // 🔧 utilita: vrátí kompletní className podle aktivního stavu
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    cn(linkBase, isActive ? linkActive : linkInactive);

  return (
    <aside
      className="sb-aside"
      aria-label={t("nav.main", { defaultValue: "Hlavní navigace" }) as string}
    >
      <div className="sb-container py-4">
        <div className="mb-4">
          <NavLink to="/app/dashboard" className="text-xl font-extrabold tracking-tight">
            STAVBAU
          </NavLink>
        </div>

        <nav className="flex flex-col gap-1" role="navigation">
          <NavLink to="/app/dashboard" end className={getNavClass}>
            {t("nav.dashboard", { defaultValue: "Přehled" })}
          </NavLink>

          {canReadProjects && (
            <NavLink to="/app/projects" className={getNavClass}>
              {t("nav.projects", { defaultValue: "Projekty" })}
            </NavLink>
          )}

          {canReadTeam && (
            <NavLink to="/app/team" className={getNavClass}>
              {t("nav.team", { defaultValue: "Tým" })}
            </NavLink>
          )}
        </nav>
      </div>
    </aside>
  );
}
