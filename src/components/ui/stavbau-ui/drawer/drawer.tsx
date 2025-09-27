// src/components/ui/stavbau-ui/drawer/drawer.tsx
import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { useTrapFocus } from "./useTrapFocus";

type DrawerSide = "right" | "bottom";

export type StbDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  side?: DrawerSide; // desktop: right, mobile: bottom
  width?: number;    // px pro desktop variantu
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode; // akční bar dole
  headerRight?: React.ReactNode; // extra tlačítka v headeru (např. Upravit, Smazat)
};

export function StbDrawer({
  open,
  onClose,
  title,
  side = "right",
  width = 560,
  children,
  className,
  footer,
  headerRight,
}: StbDrawerProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  useBodyScrollLock(open);
  useTrapFocus(panelRef, open);

  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // mobil = bottom-sheet, desktop = right panel
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const effectiveSide: DrawerSide = isMobile ? "bottom" : side;

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-[1000] transition-[visibility] duration-200",
        open ? "visible" : "invisible"
      )}
    >
      {/* backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/30 transition-opacity",
          open ? "opacity-100" : "opacity-0"
      )}
        onClick={onClose}
        aria-hidden
      />
      {/* panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute bg-white dark:bg-neutral-900 shadow-xl flex flex-col outline-none",
          effectiveSide === "right"
            ? "top-0 right-0 h-full"
            : "left-0 right-0 bottom-0 rounded-t-2xl"
          ,
          // animace
          effectiveSide === "right"
            ? (open ? "translate-x-0" : "translate-x-full")
            : (open ? "translate-y-0" : "translate-y-full"),
          "transition-transform duration-200",
          className
        )}
        style={effectiveSide === "right" ? { width } : { minHeight: "70vh" }}
      >
        {/* header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-black/5">
          <div className="text-base font-semibold">{title}</div>
          <div className="flex items-center gap-2">
            {headerRight}
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              ✕
            </button>
         </div>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* footer (safe area) */}
        {footer ? (
          <div
            className="border-t border-black/5 p-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            <div className="flex justify-end gap-2">{footer}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
