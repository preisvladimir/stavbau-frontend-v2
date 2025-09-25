import type { Column } from '@tanstack/react-table';

export type StickySide = 'left' | 'right' | null;

/**
 * Heuristika:
 * - left: sloupec označený jako Title v mobile meta
 * - right: akční sloupec (id === 'actions')
 * V budoucnu můžeme přidat columnDef.meta.stbSticky = 'left' | 'right'
 */
export function getStickySide<TData, TValue = unknown>(col: Column<TData, TValue>): StickySide {
  if (col.id === 'actions') return 'right';
  const m = (col.columnDef.meta as any)?.stbMobile;
  if (m?.isTitle) return 'left';
  return null;
}

/**
 * Tailwind utility s breakpointy:
 * - md: sticky
 * - lg: zpět na static (plná tabulka bez “přilepených” sloupců)
 */
export function stickyHeaderClasses(side: StickySide) {
  if (side === 'left') {
    return 'md:sticky md:left-0 md:z-10 md:bg-[rgb(var(--sb-surface))] lg:static';
  }
  if (side === 'right') {
    return 'md:sticky md:right-0 md:z-10 md:bg-[rgb(var(--sb-surface))] lg:static';
  }
  return '';
}

export function stickyCellClasses(side: StickySide) {
  if (side === 'left') {
    return 'md:sticky md:left-0 md:z-10 md:bg-[rgb(var(--sb-surface))] lg:static';
  }
  if (side === 'right') {
    return 'md:sticky md:right-0 md:z-10 md:bg-[rgb(var(--sb-surface))] lg:static';
  }
  return '';
}
