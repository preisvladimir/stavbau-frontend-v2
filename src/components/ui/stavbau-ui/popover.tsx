import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** side of trigger */
  side?: Side;
  /** alignment relative to trigger */
  align?: Align;
  /** px offset from trigger */
  sideOffset?: number;
  /** close when clicking outside (default true) */
  closeOnOutsideClick?: boolean;
  /** close on Esc (default true) */
  closeOnEsc?: boolean;
  /** optional portal container */
  container?: Element | null;
  /** class on floating wrapper */
  className?: string;
  /** disable focus trap (default false) */
  disableFocusTrap?: boolean;
  children: React.ReactNode;
};

 type Ctx = {
   open: boolean;
   setOpen: (v: boolean) => void;
   triggerRef: React.RefObject<HTMLElement | null>;
   contentRef: React.RefObject<HTMLDivElement | null>;
    side: Side;
    align: Align;
    sideOffset: number;
    container: Element | null;
    closeOnOutsideClick: boolean;
    closeOnEsc: boolean;
    disableFocusTrap: boolean;
  };
const PopoverContext = React.createContext<Ctx | null>(null);
const usePopover = () => {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error("Popover.* must be inside <Popover>");
  return ctx;
};

export function Popover({
  open,
  defaultOpen,
  onOpenChange,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  container,
  className,
  disableFocusTrap = false,
  children,
}: PopoverProps) {
  const isControlled = open !== undefined;
  const [inner, setInner] = React.useState<boolean>(defaultOpen ?? false);
  const actual = isControlled ? (open as boolean) : inner;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInner(v);
    onOpenChange?.(v);
  };

 const triggerRef = React.useRef<HTMLElement | null>(null);
 const contentRef = React.useRef<HTMLDivElement | null>(null);

  const ctx: Ctx = {
    open: actual,
    setOpen,
    triggerRef,
    contentRef,
    side,
    align,
    sideOffset,
    container: container ?? (typeof document !== "undefined" ? document.body : null),
    closeOnOutsideClick,
    closeOnEsc,
    disableFocusTrap,
  };

  // close on Esc
  React.useEffect(() => {
    if (!actual || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [actual, closeOnEsc]);

  // restore focus to trigger on close
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (actual) wasOpen.current = true;
    if (!actual && wasOpen.current) {
      triggerRef.current?.focus();
      wasOpen.current = false;
    }
  }, [actual]);

  return (
    <PopoverContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </PopoverContext.Provider>
  );
}

export const PopoverTrigger = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { asChild?: boolean }>(
   ({ asChild, ...rest }, _forwarded) => {
     const { open, setOpen, triggerRef } = usePopover();
     const Comp: any = asChild ? "span" : "button";
     return (
      <Comp
         type="button"
         aria-haspopup="dialog"
         aria-expanded={open}
         aria-controls="sb-popover"
        ref={triggerRef as any}
         onClick={(e: any) => {
           rest.onClick?.(e);
           setOpen(!open);
         }}
         {...rest}
       />
     );
   }
);
PopoverTrigger.displayName = "PopoverTrigger";

export type PopoverContentProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  /** optional labelledby id */
  labelledById?: string;
};
export function PopoverContent({ className, style, children, labelledById }: PopoverContentProps) {
  const ctx = usePopover();
  const { open, setOpen, triggerRef, contentRef, side, align, sideOffset, container, closeOnOutsideClick, disableFocusTrap } = ctx;

  // outside click
  React.useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (contentRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, closeOnOutsideClick]);

  // positioning
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  React.useLayoutEffect(() => {
    if (!open) return;
    const trig = triggerRef.current;
    const cont = contentRef.current;
    if (!trig || !cont) return;
    const tb = trig.getBoundingClientRect();
    const cw = cont.offsetWidth;
    const ch = cont.offsetHeight;

    let top = 0, left = 0;
    if (side === "bottom") top = tb.bottom + sideOffset + window.scrollY;
    if (side === "top") top = tb.top - ch - sideOffset + window.scrollY;
    if (side === "left") top = tb.top + window.scrollY;
    if (side === "right") top = tb.top + window.scrollY;

    if (side === "left") left = tb.left - cw - sideOffset + window.scrollX;
    else if (side === "right") left = tb.right + sideOffset + window.scrollX;
    else {
      // top/bottom horizontal
      if (align === "start") left = tb.left + window.scrollX;
      if (align === "center") left = tb.left + (tb.width - cw) / 2 + window.scrollX;
      if (align === "end") left = tb.right - cw + window.scrollX;
    }
    setCoords({ top, left });
  }, [open, side, align, sideOffset]);

  // simple focus trap
  React.useEffect(() => {
    if (!open || disableFocusTrap) return;
    const cont = contentRef.current;
    if (!cont) return;
    const selectors = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const fEls = Array.from(cont.querySelectorAll<HTMLElement>(selectors)).filter(el => !el.hasAttribute('disabled'));
    (fEls[0] ?? cont).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const idx = fEls.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (idx <= 0) { e.preventDefault(); (fEls[fEls.length - 1] ?? cont).focus(); }
      } else {
        if (idx === fEls.length - 1) { e.preventDefault(); (fEls[0] ?? cont).focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, disableFocusTrap]);

  if (!open || !container) return null;

  const node = (
    <div
      id="sb-popover"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledById}
      ref={contentRef}
      className={cn(
       // vyšší vrstva + SOLID background (žádná průhlednost)
       "z-[80] rounded-lg border border-[rgb(var(--sb-border))] shadow-xl ring-1 ring-black/5",
        "bg-[rgb(var(--sb-surface))] dark:bg-[rgb(var(--sb-surface))]",
        // fallback, kdyby tokeny nebyly – odkomentuj pokud chceš natvrdo bílou:
        // "bg-white dark:bg-neutral-900",
        className
      )}
      style={{ position: "absolute", top: coords?.top, left: coords?.left, ...style }}
    >
      {children}
    </div>
  );

  return createPortal(node, container);
}
