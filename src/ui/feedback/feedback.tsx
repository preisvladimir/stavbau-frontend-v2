// src/providers/feedback/FeedbackProvider.tsx
import * as React from 'react';
import { ToastProvider, toast } from '@/ui/toast';
import { toApiProblem } from '@/lib/api/problem';
import { Button } from '@/components/ui/stavbau-ui/button';
import { X } from '@/components/icons';


export type Severity = 'info' | 'success' | 'warning' | 'error';

export type InlineMsg = {
  id: string;
  severity: Severity;
  title?: string;
  description?: string;
};

export type Scope = string;

type Ctx = {
  // smart rozhraní – pošli error a volitelný scope
  showError: (err: unknown, opts?: { scope?: Scope; title?: string }) => void;
  // explicitní rozhraní
  show: (msg: { severity: Severity; title?: string; description?: string; scope?: Scope }) => void;
  clear: (scope: Scope) => void;
  // vnitřně pro <InlineStatus/>
  _register: (scope: Scope, set: React.Dispatch<React.SetStateAction<InlineMsg | null>>) => void;
  _unregister: (scope: Scope) => void;
};

const FeedbackCtx = React.createContext<Ctx | null>(null);

export function useFeedback() {
  const ctx = React.useContext(FeedbackCtx);
  if (!ctx) throw new Error('useFeedback must be used within <FeedbackProvider>');
  return ctx;
}

export function FeedbackProvider({
  children,
  toastPosition = 'bottom-right',
  toastMax = 3,
  toastDuration = 4000,
}: {
  children: React.ReactNode;
  toastPosition?: React.ComponentProps<typeof ToastProvider>['position'];
  toastMax?: number;
  toastDuration?: number;
}) {
  // registry scope -> setState registrace z <InlineStatus/>
  const registry = React.useRef(
    new Map<Scope, React.Dispatch<React.SetStateAction<InlineMsg | null>>>()
  );

  const _register: Ctx['_register'] = (scope, set) => {
    registry.current.set(scope, set);
  };
  const _unregister: Ctx['_unregister'] = (scope) => {
    registry.current.delete(scope);
  };

  const clear: Ctx['clear'] = (scope) => {
    registry.current.get(scope)?.(null);
  };

  const show: Ctx['show'] = ({ severity, title, description, scope }) => {
    // pokud je pro daný scope někdo přihlášený (InlineStatus je na stránce), pošli inline
    const target = scope ? registry.current.get(scope) : undefined;
    if (scope && target) {
      target({
        id: `${Date.now()}`,
        severity,
        title,
        description,
      });
      return;
    }
    // jinak toast
    toast.show({
      variant:
        severity === 'error'
          ? 'error'
          : severity === 'warning'
            ? 'warning'
            : severity === 'success'
              ? 'success'
              : 'info',
      title,
      description,
    });
  };

  const showError: Ctx['showError'] = (err, opts) => {
    const p = toApiProblem(err);
    // 403 typicky řeší globální auth guard – netoastujeme, jen necháme ticho
    if (p.status === 403) return;
    show({
      severity: 'error',
      title: opts?.title ?? 'Chyba',
      description: p.detail ?? String(err),
      scope: opts?.scope,
    });
  };

  const value: Ctx = { showError, show, clear, _register, _unregister };

  return (
    <ToastProvider position={toastPosition} max={toastMax} duration={toastDuration}>
      <FeedbackCtx.Provider value={value}>{children}</FeedbackCtx.Provider>
    </ToastProvider>
  );
}

// Jednoduchá inline status lišta – vykresli ji kdekoli na stránce.
// Přidán onClear: pokud je poskytnut, volá se místo clear(scope).
export function InlineStatus({ scope, onClear }: { scope: Scope; onClear?: () => void }) {
  const { _register, _unregister, clear } = useFeedback();
  const [msg, setMsg] = React.useState<InlineMsg | null>(null);

  React.useEffect(() => {
    _register(scope, setMsg);
    return () => _unregister(scope);
  }, [scope, _register, _unregister]);

  if (!msg) return null;

  // deterministické barvy místo dynamických tailwind stringů
  const tone = msg.severity;
  const classes = {
    wrapper:
      tone === 'error'
        ? 'border-red-200 bg-red-50'
        : tone === 'warning'
          ? 'border-amber-200 bg-amber-50'
          : tone === 'success'
            ? 'border-green-200 bg-green-50'
            : 'border-blue-200 bg-blue-50',
    title:
      tone === 'error'
        ? 'text-red-900'
        : tone === 'warning'
          ? 'text-amber-900'
          : tone === 'success'
            ? 'text-green-900'
            : 'text-blue-900',
    desc:
      tone === 'error'
        ? 'text-red-800'
        : tone === 'warning'
          ? 'text-amber-800'
          : tone === 'success'
            ? 'text-green-800'
            : 'text-blue-800',
    close:
      tone === 'error'
        ? 'hover:bg-red-100 focus-visible:ring-red-300'
        : tone === 'warning'
          ? 'hover:bg-amber-100 focus-visible:ring-amber-300'
          : tone === 'success'
            ? 'hover:bg-green-100 focus-visible:ring-green-300'
            : 'hover:bg-blue-100 focus-visible:ring-blue-300',
    icon:
      tone === 'error'
        ? 'text-red-700'
        : tone === 'warning'
          ? 'text-amber-700'
          : tone === 'success'
            ? 'text-green-700'
            : 'text-blue-700',
  };

  const handleClear = () => {
    if (onClear) onClear();
    else clear(scope);
  };

  return (
    <div className={`mt-2 rounded-lg border p-3 text-sm ${classes.wrapper} relative`}>
      {/* close btn vpravo nahoře */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        ariaLabel="Zavřít"
        onClick={handleClear}
        className={`absolute right-1.5 top-1.5 ${classes.close}`}
        title="Zavřít"
      >
        <X size={16} className={classes.icon} />
      </Button>
      {msg.title && <div className={`pr-7 font-medium ${classes.title}`}>{msg.title}</div>}
      {msg.description && <div className={`mt-0.5 pr-7 ${classes.desc}`}>{msg.description}</div>}
    </div>
  );
}