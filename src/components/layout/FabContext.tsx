// src/components/layout/FabContext.tsx
import React from "react";
import { Button } from "@/components/ui/stavbau-ui";
import { Plus } from "@/components/icons";

/** ---- FAB Context (pro stránky: useFab().setFab(...) ) ---- */
export type FabConfig = { label: string; onClick: () => void; icon?: React.ReactNode } | null;

export const FabCtx = React.createContext<{ fab: FabConfig; setFab: (c: FabConfig) => void } | null>(null);

export const FabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fab, setFab] = React.useState<FabConfig>(null);
  return <FabCtx.Provider value={{ fab, setFab }}>{children}</FabCtx.Provider>;
};

/** Hook pro stránky – musí běžet uvnitř AppLayout */
export const useFab = () => {
  const ctx = React.useContext(FabCtx);
  if (!ctx) throw new Error("useFab must be used within FabProvider");
  return ctx;
};

/** ---- Floating Action Button (FAB) na mobilu ---- */
export const MobileFab: React.FC = () => {
  const ctx = React.useContext(FabCtx);
  if (!ctx || !ctx.fab) return null;
  const { fab } = ctx;
  return (
    <div className="md:hidden fixed z-40 right-4 bottom-20">
      <Button
        variant="fab"
        onClick={fab.onClick}
        ariaLabel={fab.label}
        className="!h-14 !w-14 rounded-full shadow-lg"
        leftIcon={fab.icon ?? <Plus className="h-6 w-6" aria-hidden="true" />}
        title={fab.label}
      />
    </div>
  );
};

/** 🔵 NOVÉ: Desktop slot do Topbaru – zrcadlí stejnou akci jako MobileFab */
export const TopbarActions: React.FC = () => {
  const ctx = React.useContext(FabCtx);
  if (!ctx || !ctx.fab) return null;
  const { fab } = ctx;

  return (
    <div className="hidden md:flex items-center gap-2">
      <Button
        onClick={fab.onClick}
        leftIcon={fab.icon ?? <Plus className="h-4 w-4" aria-hidden="true" />}
      >
        {fab.label ?? "Akce"}
      </Button>
    </div>
  );
};

export const MobileFabOld: React.FC = () => {
  const { fab } = useFab();
  if (!fab) return null;
  return (
    <button className="md:hidden sb-fab" onClick={fab.onClick} aria-label={fab.label} title={fab.label}>
      {fab.icon ?? <span className="text-2xl leading-none">+</span>}
    </button>
  );
};