import type { ReactNode } from 'react';

/**
 * TanStack Table – module augmentation
 * Přidáváme mobilní meta-informace do columnDef.meta.stbMobile
 * Bez vlivu na stávající vykreslování tabulky (Step 1 = pouze typy).
 */
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    /**
     * Stavbau mobilní metadata pro DataTableV2 (hybridní responzivita)
     */
    stbMobile?: {
      /** Primární pole karty (velký nadpis) */
      isTitle?: boolean;
      /** Sekundární pole karty (podnadpis) */
      isSubtitle?: boolean;
      /**
       * Pořadí zobrazení na kartě (nižší = výše).
       * Doporučený rozsah 0–100, default ~99.
       */
      priority?: number;
      /** Skrytí v mobilní kartě */
      mobileHidden?: boolean;
      /**
       * Formatter pro mobilní zobrazení.
       * Pokud není uveden, použijeme defaultní render hodnoty.
       */
      formatter?: (value: TValue, row: TData) => ReactNode;
    };
  }
}

export {};
