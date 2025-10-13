import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type TableHeaderProps = {
  /** Hlavní titulek sekce (např. „Tým“). */
  title: React.ReactNode;
  /** Volitelný podtitulek (malý, tlumený text pod titulkem). */
  subtitle?: React.ReactNode;
  /** Volitelný popis (ještě menší text pod podtitulem). */
  description?: React.ReactNode;

  /** Akce vpravo (tlačítka, dropdowny…). Volající si může obalit ScopeGuardem. */
  actions?: React.ReactNode;

  /** Obsah pod hlavičkou (např. filtry/toolbar). */
  children?: React.ReactNode;

  /** Stylování/kompozice. */
  className?: string;
  contentClassName?: string;    // pro vnitřní obal (např. mezery)
};

export function TableHeader({
  title,
  subtitle,
  description,
  actions,
  children,
  className,
  contentClassName,
}: TableHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {/* Hlavní řádek: titulek vlevo, akce vpravo */}
      <div className="mb-3 flex items-center justify-between gap-2 md:gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold leading-tight">{title}</h1>
          {subtitle ? (
            <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
          {description ? (
            <div className="mt-0.5 text-xs text-muted-foreground/80">{description}</div>
          ) : null}
        </div>

        {/* Akce: na malých šířkách schovat, ať nezlomí titulek; volitelně přizpůsob po projektu */}
        <div className="hidden min-w-0 w-full md:w-auto md:flex items-center gap-2 md:gap-3">
          {actions}
        </div>
      </div>

      {/* Sekundární řádek pod hlavičkou – filtry, přepínače, cokoliv */}
      {children ? (
        <div className={cn('flex flex-wrap items-center gap-2 md:gap-3', contentClassName)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
