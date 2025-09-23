import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/stavbau-ui/popover';

type Value = string;

type Ctx = {
  value?: Value;
  onChange?: (v: Value) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  labelledBy?: string;
};

const Ctx = React.createContext<Ctx | null>(null);
const useMS = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('MenuSelect: components must be used inside <MenuSelect/>');
  return ctx;
};

export type MenuSelectProps = {
  value?: Value;
  defaultValue?: Value;
  onChange?: (v: Value) => void;
  children: React.ReactNode;
  labelledBy?: string; // id titulku pro ARIA
  // forward Popover props pokud budeš chtít (side, align...) — teď nastavíme defaulty uvnitř
};

export function MenuSelect({
  value,
  defaultValue,
  onChange,
  children,
  labelledBy,
}: MenuSelectProps) {
  const controlled = value !== undefined;
  const [inner, setInner] = React.useState<Value | undefined>(defaultValue);
  const [open, setOpen] = React.useState(false);

  const val = controlled ? value : inner;
  const setVal = (v: Value) => {
    if (!controlled) setInner(v);
    onChange?.(v);
    setOpen(false);
  };

  const ctx: Ctx = { value: val, onChange: setVal, open, setOpen, labelledBy };

  return (
    <Popover open={open} onOpenChange={setOpen} side="bottom" align="start" sideOffset={8}>
      <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
    </Popover>
  );
}

export type MenuSelectTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  placeholder?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
};

export function MenuSelectTrigger({
  className,
  placeholder,
  startIcon,
  endIcon,
  children,
  ...rest
}: MenuSelectTriggerProps) {
  const { open } = useMS();
  return (
    <PopoverTrigger
      type="button"
      className={cn(
        'relative cursor-pointer select-none pl-3 pr-8 py-2 rounded-lg border border-[rgb(var(--sb-border))] bg-background',
        'text-sm leading-none inline-flex items-center gap-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--sb-primary))] focus-visible:ring-offset-1',
        className
      )}
      aria-expanded={open}
      {...rest}
    >
      {startIcon}
      <span className="truncate">{children ?? placeholder}</span>
      {/* caret mimo text; rotace podle aria-expanded */}
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className={cn(
          'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/70 transition-transform',
          open && 'rotate-180'
        )}
      >
        <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
      </svg>
      {endIcon}
    </PopoverTrigger>
  );
}

export type MenuSelectContentProps = {
  className?: string;
  children: React.ReactNode;
};

export function MenuSelectContent({ className, children }: MenuSelectContentProps) {
  const { labelledBy } = useMS();
  return (
    <PopoverContent
      labelledById={labelledBy}
      className={cn(
        // solid background + vyšší vrstva (neprůsvitné, nepřekrývá se s tabulkou)
        'p-1 min-w-[12rem] rounded-lg border border-[rgb(var(--sb-border))] shadow-xl',
        'bg-[rgb(var(--sb-surface))]',
        className
      )}
    >
      {/* role/aria patří na vnitřní list, ne na PopoverContent */}
      <ul className="max-h-60 overflow-auto" role="listbox" aria-labelledby={labelledBy}>
        {children}
      </ul>
    </PopoverContent>
  );
}

export type MenuSelectItemProps = {
  value: Value;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  startIcon?: React.ReactNode;
};

export function MenuSelectItem({ value, disabled, className, children, startIcon }: MenuSelectItemProps) {
  const { value: cur, onChange } = useMS();
  const selected = cur === value;
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'w-full text-left px-2 py-2 rounded-md text-sm inline-flex items-center gap-2',
          selected ? 'bg-muted font-medium' : 'hover:bg-muted/50',
          disabled && 'opacity-60 pointer-events-none',
          className
        )}
        onClick={() => onChange?.(value)}
      >
        {startIcon}
        <span className="truncate">{children}</span>
      </button>
    </li>
  );
}
