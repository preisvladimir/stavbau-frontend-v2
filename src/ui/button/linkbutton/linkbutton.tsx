// src/components/ui/LinkButton.tsx
import * as React from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "@/components/icons";
import { buttonVariants } from "./button"; // sdílené varianty

type CommonProps = {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  ariaLabel?: string;
  loadingLabel?: string;
} & VariantProps<typeof buttonVariants>;

type AnchorOnlyProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  to?: never;
};
type RouterOnlyProps = Omit<LinkProps, "className"> & {
  to: LinkProps["to"];
  href?: never;
};
type LinkButtonBaseProps = (AnchorOnlyProps | RouterOnlyProps) & CommonProps;

export type LinkButtonProps = LinkButtonBaseProps & {
  className?: string;
  fullWidth?: boolean | undefined;
};

/**
 * LinkButton – polymorfní CTA pro <a> i <Link>, sjednocené vzhledem s Button.
 * - Variants/size/fullWidth shodné s Button
 * - Při isLoading: zobrazí spinner a zablokuje interakci (pointer-events-none)
 * - Bezpečně nastaví rel pro externí odkazy s target="_blank"
 */
export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      leftIcon,
      rightIcon,
      isLoading,
      ariaLabel,
      loadingLabel = "Loading…",
      target,
      rel,
      children,
      ...rest
    },
    ref
  ) => {
    const classes = cn(
      buttonVariants({ variant, size, fullWidth }),
      // anchor neumí disabled → pseudo disable přes pointer-events/opacity + aria
      isLoading ? "pointer-events-none" : "",
      className
    );

    // externí odkaz bezpečně doplní rel
    const computedRel =
      target === "_blank" ? [rel, "noopener", "noreferrer"].filter(Boolean).join(" ") : rel;

    const Content = (
      <>
        {isLoading ? (
          <span className="inline-flex items-center">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingLabel}</span>
          </span>
        ) : (
          leftIcon && <span className="inline-flex">{leftIcon}</span>
        )}
        {children ? <span>{children}</span> : null}
        {!isLoading && rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
      </>
    );

    if ("to" in rest && rest.to !== undefined) {
      const { to, replace, state, preventScrollReset, relative } = rest;
      return (
        <Link
          ref={ref}
          to={to}
          replace={replace}
          state={state}
          preventScrollReset={preventScrollReset}
          relative={relative}
          className={classes}
          aria-busy={isLoading || undefined}
          aria-label={ariaLabel}
          role="button"
        >
          {Content}
        </Link>
      );
    }

    const { href, ...anchorProps } = rest as AnchorOnlyProps;
    return (
      <a
        ref={ref}
        href={href}
        target={target}
        rel={computedRel}
        className={classes}
        aria-busy={isLoading || undefined}
        aria-label={ariaLabel}
        role="button"
        {...anchorProps}
      >
        {Content}
      </a>
    );
  }
);

LinkButton.displayName = "LinkButton";
