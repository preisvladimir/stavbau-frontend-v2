import * as React from 'react';
//import { useTranslation } from 'react-i18next';
import  ScopeGuard  from '@/lib/rbac/ScopeGuard';
import { SmartEmptyState } from './SmartEmptyState';

type ServerTableEmptyProps = {
  /** Aktuální search dotaz (pro odlišení search vs. empty). */
  q?: string;
  /** i18n namespaces, např. ['team', 'common'] */
  i18nNamespaces?: string[];
  /** Vyprázdnění hledání (volá se ve search variantě). */
  onClearSearch?: () => void;

  /** Klíče pro „search“ stav (fallback přes defaultValue uvnitř). */
  searchTitleKey?: string;   // default: "list.emptyTitle"
  searchDescKey?: string;    // default: "list.emptyDesc"
  clearLabelKey?: string;    // default: "list.actions.open"

  /** Klíče pro „empty“ stav (fallbacky shodné). */
  emptyTitleKey?: string;    // default: "list.emptyTitle"
  emptyDescKey?: string;     // default: "list.emptyDesc"

  /** Volitelná primární akce pro „empty“ stav (bez search). */
  emptyAction?: React.ReactNode;

  /** Volitelný RBAC guard pro akci (anyOf). Pokud zadáš, obalíme akci do ScopeGuard. */
  requiredScopesAnyOf?: string[];
};

export function ServerTableEmpty(props: ServerTableEmptyProps) {
  const {
    q,
    i18nNamespaces,
    onClearSearch,
    searchTitleKey = 'list.emptyTitle',
    searchDescKey = 'list.emptyDesc',
    clearLabelKey = 'list.actions.open',
    emptyTitleKey = 'list.emptyTitle',
    emptyDescKey = 'list.emptyDesc',
    emptyAction,
    requiredScopesAnyOf,
  } = props;

  const hasSearch = !!q;

  const actionNode = React.useMemo(() => {
    if (!emptyAction) return null;
    return requiredScopesAnyOf && requiredScopesAnyOf.length > 0
      ? <ScopeGuard anyOf={requiredScopesAnyOf}>{emptyAction}</ScopeGuard>
      : emptyAction;
  }, [emptyAction, requiredScopesAnyOf]);

  return (
    <SmartEmptyState
      hasSearch={hasSearch}
      i18nNamespaces={i18nNamespaces}
      // search varianta
      searchTitleKey={searchTitleKey}
      searchDescKey={searchDescKey}
      clearLabelKey={clearLabelKey}
      onClearSearch={onClearSearch}
      // empty varianta
      emptyTitleKey={emptyTitleKey}
      emptyDescKey={emptyDescKey}
      emptyAction={actionNode ?? undefined}
    />
  );
}
