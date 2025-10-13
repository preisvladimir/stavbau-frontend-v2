import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { useTrapFocus } from "./useTrapFocus";
import { Button } from "@/components/ui/stavbau-ui/button";

type DrawerSide = "right" | "bottom";

export type StbDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  side?: DrawerSide; // desktop: right, mobile: bottom
  width?: number;    // px pro desktop variantu
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;     // akční bar dole
  headerRight?: React.ReactNode; // tlačítka v headeru
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

  // 🔒 scroll + focus trap
  useBodyScrollLock(open);
  useTrapFocus(panelRef, open);

  // ⌨️ ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // 📱 mobil = bottom-sheet, desktop = right panel
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches;
  const effectiveSide: DrawerSide = isMobile ? "bottom" : side;

  const panelStyle =
    effectiveSide === "right"
      ? { width, height: "100dvh" }
      : {
          height: "min(85dvh, calc(100dvh - 16px))",
          maxHeight: "calc(100dvh - 16px)",
        };

  // 🎯 Správa fokusu: uložit trigger při otevření, vrátit při zavření
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) {
      // uložit aktivní element jako trigger
      triggerRef.current = (document.activeElement as HTMLElement) ?? null;

      // po otevření zaměř panel (pokud nic v něm fokus nemá)
      requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const active = document.activeElement as HTMLElement | null;
        if (!active || !panel.contains(active)) {
          panel.focus();
        }
      });
    } else {
      // při zavření: pokud fokus zůstal uvnitř panelu → blur + vrátit na trigger
      const panel = panelRef.current;
      const active = document.activeElement as HTMLElement | null;
      if (panel && active && panel.contains(active)) {
        active.blur();
      }
      triggerRef.current?.focus?.();
      triggerRef.current = null;
    }
  }, [open]);

  // (volitelné) zneaktivnit app-root mimo dialog – inert/aria-hidden na sourozence
  // React.useEffect(() => {
  //   const appRoot = document.getElementById("app-root");
  //   if (!appRoot) return;
  //   if (open) {
  //     appRoot.setAttribute("inert", "");
  //     appRoot.setAttribute("aria-hidden", "true");
  //   } else {
  //     appRoot.removeAttribute("inert");
  //     appRoot.removeAttribute("aria-hidden");
  //   }
  // }, [open]);

  return (
    <div
      // ❌ NEPOUŽÍVAT aria-hidden na wrapperu dialogu
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
        aria-hidden="true"
      />

      {/* panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1} 
        className={cn(
          "absolute bg-white dark:bg-neutral-900 shadow-xl flex flex-col outline-none overflow-hidden",
          effectiveSide === "right"
            ? "top-0 right-0 h-full"
            : "left-0 right-0 bottom-0 rounded-t-2xl",
          effectiveSide === "right"
            ? open ? "translate-x-0" : "translate-x-full"
            : open ? "translate-y-0" : "translate-y-full",
          "transition-transform duration-200",
          className
        )}
        style={panelStyle}
      >
        {/* header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-black/5">
          <div className="text-base font-semibold">{title}</div>
          <div className="flex items-center gap-2">
            {headerRight}
            <Button
              variant="ghost"
              size="sm"
              ariaLabel="Zavřít"
              onClick={onClose}
            >
              ✕
            </Button>
          </div>
        </div>

        {/* content (scrollable) */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>

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
