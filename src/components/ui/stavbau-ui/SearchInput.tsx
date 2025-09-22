// src/components/ui/stavbau-ui/SearchInput.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Search as SearchIcon, X as XIcon } from "@/components/icons";

const searchInputVariants = cva(
  "block w-full rounded-xl border border-[rgb(var(--sb-border))] bg-white " +
  "placeholder:text-[rgb(var(--sb-muted))] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 " +
  "disabled:opacity-60 disabled:cursor-not-allowed sb-input sb-input--search",
  {
    variants: {
      size: {
        sm: "h-9 text-sm",
        md: "h-11 text-sm",
        lg: "h-12 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { size: "md", fullWidth: true },
  }
);

type Size = NonNullable<VariantProps<typeof searchInputVariants>["size"]>;

function padLeft(size: Size, hasLeft: boolean) {
  if (!hasLeft) return "pl-3";
  switch (size) {
    case "sm":
      return "pl-9";
    case "md":
      return "pl-12";
    case "lg":
      return "pl-14";
  }
}

function padRight(size: Size, hasRight: boolean) {
  if (!hasRight) return "pr-3";
  switch (size) {
    case "sm":
      return "pr-9";
    case "md":
      return "pr-12";
    case "lg":
      return "pr-14";
  }
}

export interface SearchInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "value" | "onChange"
  >,
  VariantProps<typeof searchInputVariants> {
  value: string;
  onChange: (value: string) => void;

  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;

  /** Ikony (neinteraktivní) – aliasy:
   *  - leftIcon: "search" | "SearchIcon"
   *  - rightIcon: "clear" | "XIcon" | "Close"
   */
  leftIcon?: React.ReactNode | "search" | "SearchIcon";
  rightIcon?: React.ReactNode | "clear" | "XIcon" | "Close";

  /** Addons (interaktivní i neinteraktivní) – např. button, tag, select */
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;

  /** Vymazat křížkem (když je `value`) */
  clearable?: boolean;
  onClear?: () => void;

  /** A11y label */
  ariaLabel?: string;

  /** Nové: vzhledový preset – "v1" = přesně jako inline snippet */
  preset?: "default" | "v1";
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onDebouncedChange,
      debounceMs = 0,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      clearable = true,
      onClear,
      size,
      fullWidth,
      className,
      ariaLabel,
      placeholder,
      disabled,
      preset = "default",
      ...rest
    },
    ref
  ) => {
    const iconSizeClass = (s: Size) =>
      s === "sm" ? "h-3.5 w-3.5" : s === "lg" ? "h-5 w-5" : "h-4 w-4";

    // Bezpečné klonování elementu s className (typový guard)
    type ElementWithClass = React.ReactElement<{ className?: string }>;
    const isElementWithClass = (
      el: React.ReactElement<any>
    ): el is ElementWithClass =>
      !!(el.props && typeof el.props === "object" && "className" in (el.props as any));

    const resolveLeftIconEl = (
      icon: SearchInputProps["leftIcon"],
      s: Size
    ): React.ReactNode => {
      if (!icon) return null;
      if (typeof icon === "string") {
        if (icon === "search" || icon === "SearchIcon") {
          return <SearchIcon className={iconSizeClass(s)} />;
        }
        return null;
      }
      if (React.isValidElement(icon)) {
        const el = icon as React.ReactElement<any>;
        if (isElementWithClass(el)) {
          return React.cloneElement(el as ElementWithClass, {
            className: cn((el.props as any).className, iconSizeClass(s)),
          });
        }
        return el;
      }
      return null;
    };

    const resolveRightIconEl = (
      icon: SearchInputProps["rightIcon"],
      s: Size
    ): React.ReactNode => {
      if (!icon) return null;
      if (typeof icon === "string") {
        if (icon === "clear" || icon === "XIcon" || icon === "Close") {
          return <XIcon className={iconSizeClass(s)} />;
        }
        return null;
      }
      if (React.isValidElement(icon)) {
        const el = icon as React.ReactElement<any>;
        if (isElementWithClass(el)) {
          return React.cloneElement(el as ElementWithClass, {
            className: cn((el.props as any).className, iconSizeClass(s)),
          });
        }
        return el;
      }
      return null;
    };

    const _size: Size = size ?? "md";

    const leftIconEl = leftAddon ? null : resolveLeftIconEl(leftIcon, _size);
    const rightIconEl = resolveRightIconEl(rightIcon, _size);

    const hasLeftAddon = !!leftAddon;
    const hasLeftIcon = !!leftIconEl;
    const hasRightAddon = !!rightAddon;
    const hasRightIcon = !!rightIconEl;
    const hasClear = clearable && !!value;

    // Debounce
    const latest = React.useRef(value);
    React.useEffect(() => {
      if (!onDebouncedChange) return;
      if (debounceMs <= 0) {
        onDebouncedChange(value);
        return;
      }
      latest.current = value;
      const id = window.setTimeout(() => {
        onDebouncedChange(latest.current);
      }, debounceMs);
      return () => window.clearTimeout(id);
    }, [value, onDebouncedChange, debounceMs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value);
    const handleClear = () => (onClear ? onClear() : onChange(""));

    // === VZHLED: preset "v1" kopíruje inline snippet ===
    const isV1 = preset === "v1";

    // robust: přidej padding i když resolver ikonu nepoznal, ale prop je předaný
    const wantsLeft = hasLeftAddon || hasLeftIcon || !!leftIcon;
    const wantsRight = hasRightAddon || hasRightIcon || hasClear || !!rightIcon;
    const leftPadding = isV1 ? "pl-10" : padLeft(_size, wantsLeft);
    const rightPadding = isV1 ? "pr-10" : padRight(_size, wantsRight);

    // base třídy pro input
    const baseInputCls = isV1
      ? "block w-full h-11 rounded-xl border border-[rgb(var(--sb-border))] bg-white text-sm"
      : searchInputVariants({ size: _size, fullWidth });

    // Pozice ikon v1 vs default
    const leftIconWrapCls = isV1
      ? "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--sb-muted))]"
      : "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--sb-muted))]";

    const trailingWrapCls = isV1
      ? "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1"
      : "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1";

    return (
      <div className={cn("relative", fullWidth !== false && "w-full")}>
        {hasLeftAddon && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {leftAddon}
          </div>
        )}

        {leftIconEl && (
          <span className={leftIconWrapCls} aria-hidden="true">
            {leftIconEl}
          </span>
        )}

        <input
          ref={ref}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label={ariaLabel ?? "Search"}
          disabled={disabled}
          className={cn(baseInputCls, leftPadding, rightPadding, className)}
          {...rest}
        />

        {(hasRightIcon || hasClear || hasRightAddon) && (
          <div className={trailingWrapCls}>
            {hasRightIcon && (
              <span className="pointer-events-none text-[rgb(var(--sb-muted))]" aria-hidden="true">
                {rightIconEl}
              </span>
            )}
            {hasClear && (
              <button
                type="button"
                onClick={handleClear}
                className={cn("rounded-md", !isV1 && "p-1 hover:bg-slate-100")}
                aria-label="Clear search"
                disabled={disabled}
              >
                <XIcon className={cn(iconSizeClass(_size), "text-[rgb(var(--sb-muted))]")} aria-hidden="true" />
              </button>
            )}
            {hasRightAddon && rightAddon}
          </div>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";