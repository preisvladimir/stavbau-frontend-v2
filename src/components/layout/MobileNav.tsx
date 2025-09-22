// src/components/layout/MobileNav.tsx
import * as React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Folder, Users, LogOut } from "@/components/icons";

export const MobileBottomBarOld: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => (
  <nav className="md:hidden sb-bottom-bar">
    <NavLink to="/dashboard" className="text-center text-xs">Dashboard</NavLink>
    <NavLink to="/projects"  className="text-center text-xs">Projekty</NavLink>
    <NavLink to="/team"      className="text-center text-xs">Tým</NavLink>
    <button onClick={onLogout} className="text-center text-xs">Odhlásit</button>
  </nav>
);

/** ---- Mobile Bottom Bar (jen ≤ md) ---- */
export const MobileBottomBar: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  return (
    <nav
      className="
        md:hidden fixed bottom-0 left-0 right-0 z-40
        mx-auto max-w-screen-xl
        bg-white/95 backdrop-blur border-t border-[rgb(var(--sb-border))]
      "
      role="navigation"
      aria-label="Hlavní navigace (mobil)"
    >
      <ul className="grid grid-cols-4">
        <li>
          <NavLink
            to="/app/dashboard"
            className={({ isActive }) =>
              [
                "flex h-14 items-center justify-center gap-2 text-sm",
                isActive ? "text-black font-medium" : "text-[rgb(var(--sb-muted))]",
              ].join(" ")
            }
          >
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/app/projects"
            className={({ isActive }) =>
              [
                "flex h-14 items-center justify-center gap-2 text-sm",
                isActive ? "text-black font-medium" : "text-[rgb(var(--sb-muted))]",
              ].join(" ")
            }
          >
            <Folder className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Projekty</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/app/team"
            className={({ isActive }) =>
              [
                "flex h-14 items-center justify-center gap-2 text-sm",
                isActive ? "text-black font-medium" : "text-[rgb(var(--sb-muted))]",
              ].join(" ")
            }
          >
            <Users className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Tým</span>
          </NavLink>
        </li>
        <li>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-14 w-full items-center justify-center gap-2 text-sm text-[rgb(var(--sb-muted))] hover:text-black"
            aria-label="Odhlásit se"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
};
