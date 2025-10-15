import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/stavbau-ui/popover';

export type VisibilityItem = {
    id: string;
    label: React.ReactNode;
    checked: boolean;
    disabled?: boolean;
};

export type ColumnVisibilityMenuProps = {
    /** Text tlačítka (i18n venku), např. t('datatable.showColumns') */
    triggerLabel: React.ReactNode;
    /** Nadpis uvnitř panelu (i18n venku), např. t('datatable.columns') */
    title?: React.ReactNode;
    /** Text reset tlačítka (i18n venku), např. t('datatable.reset') */
    resetLabel?: React.ReactNode;

    /** Položky checkbox listu */
    items: VisibilityItem[];
    /** Změna jedné položky */
    onToggle: (id: string, value: boolean) => void;
    /** Reset viditelnosti (obvykle table.resetColumnVisibility()) */
    onReset?: () => void;

    /** UI varianta (default 'details' jako 0-deps fallback) */
    variant?: 'details' | 'popover';

    /** A11y pro trigger */
    ariaLabel?: string;

    /** Stylování */
    className?: string;
    panelClassName?: string;
};

export function ColumnVisibilityMenu({
    triggerLabel,
    title,
    resetLabel = 'Reset',
    items,
    onToggle,
    onReset,
    variant = 'details',
    ariaLabel,
    className,
    panelClassName,
}: ColumnVisibilityMenuProps) {
    // sjednocené třídy pro trigger – shoda se SearchInput/Select
    const triggerCls =
        'relative cursor-pointer select-none pl-3 pr-8 py-2 rounded-lg border border-[rgb(var(--sb-border))] ' +
        'bg-background hover:bg-muted/40 text-sm leading-none inline-flex items-center ' + // bez gap – caret je absolutní
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--sb-primary))] focus-visible:ring-offset-1';

    const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div
            className={cn(
                'w-56 rounded-lg border border-[rgb(var(--sb-border))] bg-popover p-2 shadow-lg',
                panelClassName
            )}
            role="dialog"
            aria-label={typeof title === 'string' ? title : undefined}
        >
            <div className="flex items-center justify-between mb-2">
                <span id="cols-title" className="text-xs text-foreground/70">
                    {title}
                </span>
                {onReset && (
                    <button
                        type="button"
                        className="text-xs underline"
                        onClick={onReset}
                        data-testid="dtv2-columns-reset"
                    >
                        {resetLabel}
                    </button>
                )}
            </div>
            <ul className="max-h-56 overflow-auto space-y-1" data-testid="dtv2-columns-list">
                {children}
            </ul>
        </div>
    );

    const Items = () => (
        <>
            {items.map(({ id, label, checked, disabled }) => (
                <li key={id} className="flex items-center gap-2 text-sm">
                    <input
                        id={`col-${id}`}
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={(e) => onToggle(id, e.currentTarget.checked)}
                    />
                    <label htmlFor={`col-${id}`}>{label}</label>
                </li>
            ))}
        </>
    );

    if (variant === 'details') {
        return (
            <div className={cn('relative', className)} data-testid="dtv2-columns">
                <details>
                    <summary
                        className={triggerCls}
                        aria-label={typeof ariaLabel === 'string' ? ariaLabel : undefined}
                        data-testid="dtv2-columns-trigger"
                    >
                        <span className="truncate">{triggerLabel}</span>
                        {/* caret jako u Selectu (mimo text) */}
                        <svg
                            aria-hidden
                            viewBox="0 0 20 20"
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/70"
                        >
                            <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
                        </svg>
                    </summary>
                    <div className="absolute z-50 mt-1">
                        <Panel>
                            <Items />
                        </Panel>
                    </div>
                </details>
            </div>
        );
    }

    // variant="popover" – náš Popover (portál, Esc/outside close, focus handling)
    return (
        <div className={cn('relative', className)} data-testid="dtv2-columns">
            <Popover side="bottom" align="start" sideOffset={8}>
                <PopoverTrigger
                    className={triggerCls}
                    aria-label={typeof ariaLabel === 'string' ? ariaLabel : undefined}
                    data-testid="dtv2-columns-trigger"
                >
                    <span className="truncate">{triggerLabel}</span>
                    <svg
                        aria-hidden
                        viewBox="0 0 20 20"
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/70 transition-transform aria-expanded:rotate-180"
                    >
                        <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
                    </svg>
                </PopoverTrigger>
                <PopoverContent className="p-0" labelledById="cols-title">
                    <Panel>
                        <Items />
                    </Panel>
                </PopoverContent>
            </Popover>
        </div>
    );
}