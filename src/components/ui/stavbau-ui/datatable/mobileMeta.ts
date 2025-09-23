import type { ReactNode } from 'react';

export interface StbMobileMeta<TData, TValue = unknown> {
  isTitle?: boolean;
  isSubtitle?: boolean;
  priority?: number;
  mobileHidden?: boolean;
  formatter?: (value: TValue, row: TData) => ReactNode;
}

export const defaultMobileMeta: Required<Omit<StbMobileMeta<any, any>, 'formatter'>> = {
  isTitle: false,
  isSubtitle: false,
  priority: 99,
  mobileHidden: false,
};

export function normalizeMobileMeta<TData, TValue = unknown>(
  meta?: StbMobileMeta<TData, TValue>
): Required<Omit<StbMobileMeta<TData, TValue>, 'formatter'>> & Pick<StbMobileMeta<TData, TValue>, 'formatter'> {
  return {
    ...defaultMobileMeta,
    ...meta,
  };
}
