import { useState, type ReactNode } from 'react';
import type { Row } from '@tanstack/react-table';
import { normalizeMobileMeta } from './mobileMeta';

//type AnyRow = Row<any>;

/**
 * DataRowCard
 * - Mobilní prezentace jednoho řádku jako "karty"
 * - Využívá columnDef.meta.stbMobile (Step 1)
 */
export function DataRowCard<TData>({
    row,
    actionsRenderer,
    onRowClick,
}: {
    row: Row<TData>;
    /** volitelný renderer akcí pro mobil (kebab/ikonky) */
    actionsRenderer?: (row: TData) => ReactNode;
    /** volitelný click handler na celou kartu */
    onRowClick?: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    // 1) Získáme všechny viditelné buňky a obohatíme je o mobilní metadata
    const cells = row.getVisibleCells().map((cell) => {
        const col = cell.column;
        const meta = normalizeMobileMeta<any, any>(col.columnDef.meta?.stbMobile);
        const value = cell.getValue();
        const render: ReactNode =
            meta.formatter ? meta.formatter(value, row.original) : (cell.renderValue() as ReactNode);
        return {
            id: col.id,
            header: (col.columnDef.header as any)?.toString?.() ?? '',
            meta,
            render,
            isActions: col.id === 'actions', // heuristika: akční sloupec
            isTitle: !!meta.isTitle,
            isSubtitle: !!meta.isSubtitle,
        };
    });

    // 2) Oddělíme akce, title, subtitle a ostatní pole
    const actions = cells.find((c) => c.isActions);
    const title = cells.find((c) => c.isTitle && !c.meta.mobileHidden);
    const subtitle = cells.find((c) => c.isSubtitle && !c.meta.mobileHidden);

    // fallback title: první ne-skryté pole s nejnižší priority
    const fallbackTitle =
        title ??
        cells
            .filter((c) => !c.isActions && !c.isSubtitle && !c.meta.mobileHidden)
            .sort((a, b) => (a.meta.priority ?? 99) - (b.meta.priority ?? 99))[0];

    const infoFields = cells
        .filter(
            (c) =>
                !c.isActions &&
                c.id !== fallbackTitle?.id &&
                c.id !== subtitle?.id &&
                !c.meta.mobileHidden
        )
        .sort((a, b) => (a.meta.priority ?? 99) - (b.meta.priority ?? 99));

    // Kolik detailů ukázat v collapsed stavu
    const COLLAPSED_COUNT = 4;
    const visibleInfo = expanded ? infoFields : infoFields.slice(0, COLLAPSED_COUNT);
    const hasMore = infoFields.length > COLLAPSED_COUNT;

    const handleActionClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
        // zabrání přeposílání na případný onRowClick na celé kartě
        e.stopPropagation();
    };

    return (
        <div
            className="rounded-2xl border bg-background p-3 shadow-sm"
            onClick={onRowClick}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : -1}
            aria-label={onRowClick ? 'Row clickable' : undefined}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="font-medium leading-6 line-clamp-2 break-words">
                        {fallbackTitle?.render ?? <span className="text-muted-foreground">—</span>}
                    </div>
                    {subtitle && (
                        <div className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {subtitle.render}
                        </div>
                    )}
                </div>
                {/* Actions (pokud existují) */}
                {(actions || actionsRenderer) && (
                    <div className="shrink-0" onClick={handleActionClick}>
                        {/* 1) preferuj akční cell z tabulky, 2) fallback na prop actionsRenderer */}
                        {actions?.render ?? (actionsRenderer && actionsRenderer(row.original))}
                    </div>
                )}
            </div>

            {/* Body – detailní dvojice: Název pole  hodnota */}
            {visibleInfo.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                    {visibleInfo.map((c) => (
                        <div key={c.id} className="flex items-start justify-between gap-3">
                            <div className="text-xs text-muted-foreground shrink-0">{c.header}</div>
                            <div className="text-sm min-w-0 text-right break-words">{c.render}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer – Show more */}
            {hasMore && (
                <div className="mt-2">
                    <button
                        type="button"
                        className="text-sm underline underline-offset-4 hover:no-underline"
                        aria-expanded={expanded}
                        onClick={() => setExpanded((v) => !v)}
                    >
                        {expanded ? 'Zobrazit méně' : `Zobrazit více (${infoFields.length - COLLAPSED_COUNT})`}
                    </button>
                </div>
            )}
        </div>
    );
}

export default DataRowCard;
