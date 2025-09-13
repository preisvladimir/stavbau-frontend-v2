import React from "react";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info";

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number; // 0 = zůstane dokud jej nezavřu ručně
  action?: { label: string; onClick: () => void };
};

type ToastItem = ToastOptions & { id: string };

type ToastContextType = {
  toast: (opts: ToastOptions) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback((opts: ToastOptions) => {
    const id = crypto.randomUUID();
    const item: ToastItem = { id, variant: "default", durationMs: 4000, ...opts };
    setToasts((t) => [...t, item]);
    if (item.durationMs && item.durationMs > 0) {
      window.setTimeout(() => dismiss(id), item.durationMs);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Container */}
      <div
        className="fixed inset-x-0 top-2 z-[9999] flex flex-col items-center gap-2 px-2 sm:inset-auto sm:right-4 sm:top-4 sm:items-end"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const variantClasses: Record<ToastVariant, string> = {
  default:     "bg-white text-gray-900 border shadow",
  destructive: "bg-red-50 text-red-900 border border-red-200 shadow",
  success:     "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow",
  warning:     "bg-amber-50 text-amber-900 border border-amber-200 shadow",
  info:        "bg-blue-50 text-blue-900 border border-blue-200 shadow",
};

const VariantIcon: React.FC<{ v: ToastVariant }> = ({ v }) => {
  const common = "h-5 w-5 shrink-0";
  switch (v) {
    case "destructive": return <XCircle className={common} aria-hidden />;
    case "success":     return <CheckCircle2 className={common} aria-hidden />;
    case "warning":     return <AlertTriangle className={common} aria-hidden />;
    case "info":        return <Info className={common} aria-hidden />;
    default:            return <Info className={common} aria-hidden />;
  }
};

const ToastCard: React.FC<{ item: ToastItem; onClose: () => void }> = ({ item, onClose }) => {
  const v = item.variant ?? "default";
  return (
    <div
      className={`w-full sm:w-[380px] rounded-2xl px-4 py-3 ${variantClasses[v]} transition-all`}
      role={v === "destructive" ? "alert" : "status"}
      aria-live={v === "destructive" ? "assertive" : "polite"}
    >
      <div className="flex items-start gap-3">
        <VariantIcon v={v} />
        <div className="flex-1 min-w-0">
          {item.title && <div className="font-medium leading-tight">{item.title}</div>}
          {item.description && (
            <div className="text-sm text-gray-600 mt-0.5">{item.description}</div>
          )}
          {item.action && (
            <button
              type="button"
              onClick={item.action.onClick}
              className="mt-2 text-sm underline underline-offset-2 hover:opacity-90"
            >
              {item.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="Zavřít upozornění"
          onClick={onClose}
          className="rounded-full p-1 hover:bg-black/5"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};
