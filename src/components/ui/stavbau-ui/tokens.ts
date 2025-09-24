// Centrální „design tokens“ pro stavbau-ui (pouze třídy Tailwind)
// Umožní konzistentní vzhled napříč komponentami.
export const sbCardBase =
  "rounded-2xl border border-[rgb(var(--sb-border))] bg-[rgb(var(--sb-surface))] shadow-sm";

export const sbCardPadding = "p-3 md:p-4";
export const sbDivider = "border-t border-[rgb(var(--sb-border))]";
export const sbHoverRow =
  "hover:bg-muted/40 md:hover:bg-[rgb(var(--sb-surface-hover))]";
export const sbFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(var(--sb-focus))] focus-visible:ring-offset-background";
