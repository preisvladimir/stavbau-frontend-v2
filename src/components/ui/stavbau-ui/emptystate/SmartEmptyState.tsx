// src/components/ui/stavbau-ui/emptystate/SmartEmptyState.tsx
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/stavbau-ui/emptystate/emptystate';
import { Button } from '@/components/ui/stavbau-ui/button';
import { X } from '@/components/icons';

type SmartEmptyStateProps = {
  /** Je aktivní vyhledávání? (např. !!q) */
  hasSearch: boolean;

  /** i18n namespaces (přebírají se i z rodiče) */
  i18nNamespaces?: string[];

  /** Hledání – i18n klíče (s defaulty) */
  searchTitleKey?: string;
  searchDescKey?: string;
  clearLabelKey?: string;

  /** Prázdný stav – i18n klíče (s defaulty) */
  emptyTitleKey?: string;
  emptyDescKey?: string;

  /** Akce: zrušit hledání (pokud nedodáš vlastní searchAction) */
  onClearSearch?: () => void;

  /** Volitelné: vlastní akce místo defaultního „Zrušit hledání“ */
  searchAction?: React.ReactNode;

  /** Akce v prázdném stavu (např. Button ve ScopeGuardu) */
  emptyAction?: React.ReactNode;
};

export function SmartEmptyState({
  hasSearch,
  i18nNamespaces = ['common'],
  // i18n keys with sensible defaults
  searchTitleKey = 'list.emptyTitle',
  searchDescKey = 'list.emptyDesc',
  clearLabelKey = 'list.actions.open',
  emptyTitleKey = 'list.emptyTitle',
  emptyDescKey = 'list.emptyDesc',
  onClearSearch,
  searchAction,
  emptyAction,
}: SmartEmptyStateProps) {
  const { t } = useTranslation(i18nNamespaces);

  if (hasSearch) {
    const actionNode =
      searchAction ??
      (onClearSearch ? (
        <Button variant="outline" leftIcon={<X size={16} />} onClick={onClearSearch}>
          {t(clearLabelKey, { defaultValue: 'Zrušit hledání' })}
        </Button>
      ) : null);

    return (
      <EmptyState
        title={t(searchTitleKey, { defaultValue: 'Nic jsme nenašli' })}
        description={t(searchDescKey, { defaultValue: 'Zkuste upravit hledaný výraz.' })}
        action={actionNode}
      />
    );
  }

  // no data
  return (
    <EmptyState
      title={t(emptyTitleKey, { defaultValue: 'Zatím žádná data' })}
      description={t(emptyDescKey, { defaultValue: 'Přidejte první položku.' })}
      action={emptyAction ?? null}
    />
  );
}
