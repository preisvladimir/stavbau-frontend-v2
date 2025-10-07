import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type SelectOption = {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
};

export type SelectProps = {
  /** Controlled value */
  value?: string | number;
  /** Uncontrolled default value */
  defaultValue?: string | number;
  /** Fires with the raw value on change */
  onChange?: (value: string) => void;

  /** Options data; if omitted, you can pass <option> children manually */
  options?: SelectOption[];

  /** Visuals */
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  fullWidth?: boolean;
  className?: string;
  selectClassName?: string;

  /** Icons */
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;

  /** Form / a11y */
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string; // rendered as disabled option when no value

  /** Validation / helper */
  error?: boolean | string;
  helperText?: React.ReactNode;

  /** Native select props passthrough */
  children?: React.ReactNode;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'defaultValue' | 'onChange' | 'size'>;

const sizeMap = {
  sm: 'h-8 text-sm px-2',
  md: 'h-10 text-sm px-3',
  lg: 'h-12 text-base px-4',
} as const;

const variantMap = {
  outline:
    'bg-background border border-[rgb(var(--sb-border))] hover:bg-muted/40',
  solid:
    'bg-[rgb(var(--sb-surface))] border border-[rgb(var(--sb-border))]',
  ghost:
    'bg-transparent border border-transparent hover:bg-muted/40',
} as const;

/**
 * Stavbau Select (native), a11y-first, mobile-friendly.
 * - Controlled/uncontrolled
 * - options[] nebo children <option>
 * - error/helper text
 * - start/end icon overlay
 */
export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      options,
      size = 'md',
      variant = 'outline',
      fullWidth,
      className,
      selectClassName,
      startIcon,
      endIcon,
      id,
      name,
      required,
      disabled,
      ariaLabel,
      placeholder,
      error,
      helperText,
      children,
      ...rest
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [inner, setInner] = React.useState<string | number | undefined>(defaultValue);

    React.useEffect(() => {
      if (isControlled) setInner(value);
    }, [isControlled, value]);

    React.useEffect(() => {
      if (import.meta.env.DEV && Array.isArray(options)) {
        const seen = new Set<string>();
        for (const o of options) {
          const v = String(o.value);
          if (seen.has(v)) {
            console.warn(`[Select] Duplicate option value detected: "${v}"`, options);
            break; // stačí ohlásit první nález
          }
          seen.add(v);
        }
      }
    }, [options]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!isControlled) setInner(e.target.value);
      onChange?.(e.target.value);
    };

    const showError = Boolean(error) && typeof error !== 'string' ? true : Boolean(error);
    const helper = typeof error === 'string' ? error : helperText;

    return (
      <div
        ref={ref}
        className={cn(fullWidth && 'w-full', className)}
      >
        <div
          className={cn(
            'relative inline-flex items-center rounded-lg transition-colors',
            sizeMap[size],
            variantMap[variant],
            disabled && 'opacity-60 pointer-events-none',
            showError && 'ring-1 ring-red-500 border-red-500',
            fullWidth ? 'w-full' : 'w-auto'
          )}
        >
          {startIcon && (
            <span className="pointer-events-none absolute left-2 inline-flex items-center">
              {startIcon}
            </span>
          )}

          <select
            id={id}
            name={name}
            aria-label={ariaLabel}
            required={required}
            disabled={disabled}
            className={cn(
              // Reset native
              'appearance-none bg-transparent outline-none',
              // Typography & space
              'pr-8', // room for chevron
              startIcon ? 'pl-6' : 'pl-0',
              // Sizing sync: select height is driven by wrapper; here only line-height
              'leading-none',
              fullWidth ? 'w-full' : 'w-auto',
              selectClassName
            )}
            value={isControlled ? (value as any) : (inner as any)}
            onChange={handleChange}
            {...rest}
          >
            {placeholder !== undefined && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}

            {options
              ? options.map((opt, i) => (
                <option
                  key={`${String(opt.value)}::${i}`}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label as any}
                </option>
              ))
              : children}
          </select>

          <span className="pointer-events-none absolute right-2 inline-flex items-center">
            {endIcon ?? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </div>

        {helper && (
          <div
            className={cn(
              'mt-1 text-xs',
              showError ? 'text-red-600' : 'text-foreground/70'
            )}
          >
            {helper}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
