import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "@/components/icons";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-[1px]",
  {
    variants: {
      variant: {
        // neutrální výchozí – „surface“ styl
        default:
          "border border-[rgb(var(--sb-border))] bg-white text-[rgb(var(--sb-fg))] hover:bg-slate-50 focus-visible:ring-gray-300",
        // brand primary (už ne černá)
        primary:
          "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600",
        outline:
          "border border-[rgb(var(--sb-border))] bg-transparent text-[rgb(var(--sb-fg))] hover:bg-slate-50 focus-visible:ring-gray-300",
        outlinegreen:
          "border border-[rgb(var(--sb-border))] bg-emerald-100 text-[rgb(var(--sb-fg))] hover:bg-slate-50 focus-visible:ring-emerald-200",          
        ghost:
          "bg-transparent text-[rgb(var(--sb-fg))] hover:bg-[rgba(var(--sb-border)/0.2)] focus-visible:ring-gray-300",
        danger:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
        // jemný destructive (subtle danger)
        destructive:
          "text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 focus-visible:ring-rose-300",
        // volitelná FAB varianta
        fab:
          "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600 shadow-lg",
      },
      size: {
        xs: '!h-12 !px-5 !text-base leading-none',
        sm: '!h-8  !px-3 !text-sm   leading-none',
        md: '!h-10 !px-4 !text-sm   leading-none',
        lg: '!h-12 !px-6 !text-base leading-none',
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    // ⬅️ klíčová změna: default = neutrální, ne primary (black)
    defaultVariants: { variant: "default", size: "md", fullWidth: false },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
  VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Zobrazí spinner, deaktivuje ovládání a přidá a11y atributy */
  isLoading?: boolean;
  /** Popisek pro čtečky (použij u icon-only buttonů) */
  ariaLabel?: string;
  /** Vlastní text pro screen-readery během načítání (fallback: "Loading…") */
  loadingLabel?: string;
}

/**
 * Button – stavový, přístupný, škálovatelný.
 * - Bezpečný default: type="button"
 * - Při isLoading: aria-busy, aria-disabled, spinner, zamknuté ovládání
 * - Icon-only varianta: vyžaduje `ariaLabel`
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      leftIcon,
      rightIcon,
      isLoading,
      children,
      disabled,
      ariaLabel,
      loadingLabel = "Loading…",
      type,
      ...props
    },
    ref
  ) => {
    const isIconOnly = !children && (!!leftIcon || !!rightIcon);

    // A11y: pokud je tlačítko pouze ikona, požadujeme aria-label
    if (process.env.NODE_ENV !== "production") {
      if (isIconOnly && !ariaLabel) {
        // eslint-disable-next-line no-console
        console.warn(
          "[Button] Icon-only button should provide `ariaLabel` for accessibility."
        );
      }
    }

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading || undefined}
        aria-busy={isLoading || undefined}
        aria-label={ariaLabel}
        data-loading={isLoading ? "true" : undefined}
        {...props}
      >
        {/* Spinner vlevo – konzistentní místo (při loadu preferujeme spinner před leftIcon) */}
        {isLoading ? (
          <span className="inline-flex items-center">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {/* Skrytý text pro SR – nechť ví, že se děje akce */}
            <span className="sr-only">{loadingLabel}</span>
          </span>
        ) : (
          leftIcon && <span className="inline-flex">{leftIcon}</span>
        )}

        {/* Obsah */}
        {children ? <span>{children}</span> : null}

        {/* Pravá ikona (neukazujeme během isLoading, ať není vizuální šum) */}
        {!isLoading && rightIcon ? (
          <span className="inline-flex">{rightIcon}</span>
        ) : null}
      </button>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
