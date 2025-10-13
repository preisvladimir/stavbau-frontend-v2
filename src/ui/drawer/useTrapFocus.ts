// src/components/ui/stavbau-ui/drawer/useTrapFocus.ts
import * as React from "react";

export function useTrapFocus(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  React.useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const focusables = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));

    const firstFocus = () => {
      const [first] = focusables();
      (first ?? root).focus();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (activeEl === first || activeEl === root) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (activeEl === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    firstFocus();
    root.addEventListener("keydown", handleKey);
    return () => root.removeEventListener("keydown", handleKey);
  }, [ref, active]);
}
