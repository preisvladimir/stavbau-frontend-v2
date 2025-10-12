import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// -----------------------------------------------------------------------------
// Typy & rozhraní
// -----------------------------------------------------------------------------

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";
export type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

export type ToastId = string;

export type ToastAction = {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
};

export type ShowToastInput = {
  id?: ToastId;                       // pro deduplikaci/update
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;                  // ms; default 4000 (min 800; 0/neg = sticky)
  action?: ToastAction;
  onClose?: () => void;
  icon?: React.ReactNode;
};

export type ToastItem = {
  id: ToastId;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant: ToastVariant;  // pevné – už ne optional
  duration: number;       // pevné – už ne optional
  action?: ToastAction;
  onClose?: () => void;
  icon?: React.ReactNode;
  createdAt: number;
};

// -----------------------------------------------------------------------------
// Kontext & veřejné API
// -----------------------------------------------------------------------------

type ToastContextValue = {
  show: (t: ShowToastInput) => ToastId;
  dismiss: (id: ToastId) => void;
  update: (id: ToastId, patch: Partial<ShowToastInput>) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() must be used within <ToastProvider>");
  return ctx;
}

// Imperativní API pro snadné použití mimo React stromy (např. v interceptorech)
export const toast = {
  show: (t: ShowToastInput) => _proxy?.show(t) ?? "",
  dismiss: (id: ToastId) => _proxy?.dismiss(id),
  update: (id: ToastId, patch: Partial<ShowToastInput>) => _proxy?.update(id, patch),
  clear: () => _proxy?.clear(),
};

let _proxy: ToastContextValue | null = null;

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

type ToastProviderProps = {
  children: React.ReactNode;
  position?: ToastPosition;
  max?: number;    // max viditelných toastů současně
  duration?: number; // výchozí auto-dismiss (ms)
  className?: string;
};

export function ToastProvider({
  children,
  position = "top-right",
  max = 3,
  duration = 4000,
  className,
}: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const queueRef = useRef<ToastItem[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // cleanup proxy jen pokud patří tomuto provideru
      if (_proxy === apiRef.current) {
        _proxy = null;
      }
    };
  }, []);

  const dismiss = useCallback((id: ToastId) => {
    setItems((curr) => {
      const item = curr.find((x) => x.id === id);
      if (item?.onClose) { try { item.onClose(); } catch {} }
      return curr.filter((t) => t.id !== id);
    });
  }, []);

  const dequeueIfPossible = useCallback(() => {
    setItems((curr) => {
      if (curr.length >= max || queueRef.current.length === 0) return curr;
      const needed = Math.max(0, max - curr.length);
      const next = queueRef.current.splice(0, needed);
      return [...curr, ...next];
    });
  }, [max]);

  const clampDuration = (ms: number | undefined): number => {
    if (typeof ms !== "number") return duration;
    if (ms <= 0) return 0; // sticky
    return Math.max(800, ms);
  };

  const show = useCallback((t: ShowToastInput) => {
    const id: ToastId = t.id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const next: ToastItem = {
      id,
      title: t.title,
      description: t.description,
      variant: t.variant ?? "default",
      duration: clampDuration(t.duration),
      action: t.action,
      onClose: t.onClose,
      icon: t.icon,
      createdAt: Date.now(),
    };

    setItems((curr) => {
      const idx = curr.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const copy = curr.slice();
        copy[idx] = { ...curr[idx], ...next };
        return copy;
      }
      if (curr.length < max) {
        return [...curr, next];
      } else {
        queueRef.current.push(next);
        return curr;
      }
    });

    setTimeout(() => mountedRef.current && dequeueIfPossible(), 0);
    return id;
  }, [dequeueIfPossible, max, duration]);

  const update = useCallback((id: ToastId, patch: Partial<ShowToastInput>) => {
    setItems((curr) => {
      const idx = curr.findIndex((t) => t.id === id);
      if (idx === -1) return curr;
      const prev = curr[idx];
      const next: ToastItem = {
        ...prev,
        ...patch,
        variant: (patch.variant ?? prev.variant) as ToastVariant,
        duration: clampDuration(patch.duration ?? prev.duration),
      };
      const copy = curr.slice();
      copy[idx] = next;
      return copy;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    queueRef.current = [];
  }, []);

  // API ref kvůli bezpečnému cleanupu
  const api = useMemo<ToastContextValue>(() => ({ show, dismiss, update, clear }), [show, dismiss, update, clear]);
  const apiRef = useRef(api);
  useEffect(() => { apiRef.current = api; }, [api]);

  // 🔑 Nastav _proxy až po mountu (a při změně API) – bezpečné i ve StrictMode/HMR
  useEffect(() => {
    _proxy = apiRef.current;
    return () => {
      if (_proxy === apiRef.current) _proxy = null;
    };
  }, [api]);

  useEffect(() => {
    if (!mountedRef.current) return;
    const t = setTimeout(() => dequeueIfPossible(), 50);
    return () => clearTimeout(t);
  }, [items.length, dequeueIfPossible]);

  const pos = positionToClasses(position);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className={[
          "pointer-events-none fixed z-[1000] flex flex-col gap-2 p-3 md:p-4",
          pos.root,
          className ?? "",
        ].join(" ")}
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {items.map((item) => (
          <ToastCard
            key={item.id}
            item={item}
            onDismiss={() => dismiss(item.id)}
            position={position}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}


// -----------------------------------------------------------------------------
// Prezentace jednoho toastu
// -----------------------------------------------------------------------------

// --- nahradit původní ToastCard v toast.tsx tímto ---

type ToastCardProps = {
  item: ToastItem;
  onDismiss: () => void;
  position: ToastPosition;
};

function ToastCard({ item, onDismiss, position }: ToastCardProps) {
  const [hovered, setHovered] = useState(false);
  const [remaining, setRemaining] = useState<number>(item.duration);
  const rafRef = useRef<number | null>(null);
  const endAtRef = useRef<number>(Date.now() + item.duration); // cílový čas

  const isAssertive = item.variant === "error" || item.variant === "warning";

  // Spustit / zastavit odpočet podle hoveru
  useEffect(() => {
    if (item.duration <= 0) return; // sticky toast

    // při „odpauzování“ nastavíme nový cílový čas podle zbývajícího času
    if (!hovered) {
      endAtRef.current = Date.now() + remaining;

      const tick = () => {
        const left = endAtRef.current - Date.now();
        setRemaining(left);
        if (left <= 0) {
          onDismiss();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    } else {
      // pauza: zastavíme animaci, remaining se nemění
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }, [hovered, item.duration, onDismiss, remaining]);

  const Icon = useMemo(() => defaultIcon(item.variant, item.icon), [item.variant, item.icon]);
  const palette = useMemo(() => variantToPalette(item.variant), [item.variant]);

  return (
    <div
      className={[
        "pointer-events-auto w-full md:w-auto",
        position.includes("center") ? "mx-auto" : "",
      ].join(" ")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={[
          "relative overflow-hidden rounded-2xl border shadow-lg md:max-w-sm",
          "backdrop-blur supports-[backdrop-filter]:bg-opacity-80",
          "transition-all duration-200",
          palette.container,
        ].join(" ")}
        role={isAssertive ? "alert" : "status"}
        aria-live={isAssertive ? "assertive" : "polite"}
      >
        {/* progress bar jen pro auto-dismiss */}
        {item.duration > 0 && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-black/10">
            <div
              className="h-full"
              style={{
                width: `${Math.max(0, (remaining / item.duration) * 100)}%`,
                transition: "width 100ms linear",
                background: palette.progressBg,
              }}
            />
          </div>
        )}

        <div className="flex items-start gap-3 p-3 md:p-4">
          {/* ikona */}
          <div className={["mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", palette.iconBg].join(" ")}>
            {Icon}
          </div>

          {/* obsah */}
          <div className="min-w-0 flex-1">
            {item.title && (
              <div className={["text-sm font-semibold leading-5", palette.title].join(" ")}>
                {item.title}
              </div>
            )}
            {item.description && (
              <div className={["mt-0.5 text-sm leading-5", palette.desc].join(" ")}>
                {item.description}
              </div>
            )}

            {/* akce */}
            {item.action && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={item.action.onClick}
                  className={[
                    "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
                    "outline-none ring-0 transition",
                    palette.actionBtn,
                  ].join(" ")}
                  aria-label={item.action.ariaLabel ?? String(item.action.label)}
                >
                  {item.action.label}
                </button>
              </div>
            )}
          </div>

          {/* zavřít */}
          <button
            type="button"
            onClick={onDismiss}
            className={[
              "ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              "outline-none ring-0 transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-black/20",
              palette.closeBtn,
            ].join(" ")}
            aria-label="Zavřít oznámení"
          >
            <span className="sr-only">Zavřít</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Pomocné styly & ikony
// -----------------------------------------------------------------------------

function positionToClasses(position: ToastPosition) {
  const common = "w-full"; // mobil: full width
  switch (position) {
    case "top-right":
      return { root: `${common} top-0 right-0 items-end md:items-end` };
    case "top-left":
      return { root: `${common} top-0 left-0 items-start md:items-start` };
    case "bottom-right":
      return { root: `${common} bottom-0 right-0 items-end md:items-end` };
    case "bottom-left":
      return { root: `${common} bottom-0 left-0 items-start md:items-start` };
    case "top-center":
      return { root: `${common} top-0 left-0 right-0 items-center` };
    case "bottom-center":
      return { root: `${common} bottom-0 left-0 right-0 items-center` };
    default:
      return { root: `${common} top-0 right-0 items-end` };
  }
}

function variantToPalette(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return {
        container: "border-emerald-200/70 bg-emerald-50 text-emerald-900",
        iconBg: "bg-emerald-200 text-emerald-800",
        title: "text-emerald-950",
        desc: "text-emerald-900/90",
        actionBtn: "bg-emerald-100 hover:bg-emerald-200 text-emerald-900",
        closeBtn: "text-emerald-900/70 hover:text-emerald-900",
        progressBg: "linear-gradient(90deg, rgba(16,185,129,.9), rgba(16,185,129,.6))",
      };
    case "error":
      return {
        container: "border-rose-200/70 bg-rose-50 text-rose-900",
        iconBg: "bg-rose-200 text-rose-800",
        title: "text-rose-950",
        desc: "text-rose-900/90",
        actionBtn: "bg-rose-100 hover:bg-rose-200 text-rose-900",
        closeBtn: "text-rose-900/70 hover:text-rose-900",
        progressBg: "linear-gradient(90deg, rgba(244,63,94,.9), rgba(244,63,94,.6))",
      };
    case "warning":
      return {
        container: "border-amber-200/70 bg-amber-50 text-amber-900",
        iconBg: "bg-amber-200 text-amber-800",
        title: "text-amber-950",
        desc: "text-amber-900/90",
        actionBtn: "bg-amber-100 hover:bg-amber-200 text-amber-900",
        closeBtn: "text-amber-900/70 hover:text-amber-900",
        progressBg: "linear-gradient(90deg, rgba(245,158,11,.9), rgba(245,158,11,.6))",
      };
    case "info":
      return {
        container: "border-sky-200/70 bg-sky-50 text-sky-900",
        iconBg: "bg-sky-200 text-sky-800",
        title: "text-sky-950",
        desc: "text-sky-900/90",
        actionBtn: "bg-sky-100 hover:bg-sky-200 text-sky-900",
        closeBtn: "text-sky-900/70 hover:text-sky-900",
        progressBg: "linear-gradient(90deg, rgba(2,132,199,.9), rgba(2,132,199,.6))",
      };
    default:
      return {
        container: "border-slate-200/70 bg-white text-slate-900",
        iconBg: "bg-slate-200 text-slate-800",
        title: "text-slate-950",
        desc: "text-slate-900/90",
        actionBtn: "bg-slate-100 hover:bg-slate-200 text-slate-900",
        closeBtn: "text-slate-900/70 hover:text-slate-900",
        progressBg: "linear-gradient(90deg, rgba(100,116,139,.9), rgba(100,116,139,.6))",
      };
  }
}

function defaultIcon(variant: ToastVariant, custom?: React.ReactNode) {
  if (custom) return custom;
  const cls = "h-4 w-4";
  switch (variant) {
    case "success":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
          <path
            d="M20 7L10 17l-6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "error":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
          <path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "warning":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
          <path d="M12 8h.01M11 12h1v6m-1-16a10 10 0 100 20 10 10 0 000-20z" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="currentColor" />
        </svg>
      );
  }
}
