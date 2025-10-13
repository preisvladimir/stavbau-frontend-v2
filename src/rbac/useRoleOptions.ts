// src/rbac/useRoleOptions.ts
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ROLE_WHITELIST, type CompanyRoleName } from './catalog';

// Fallback humanizer, když chybí i18n klíč
const humanizeRole = (r: string) =>
  r.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export type RoleOption = { value: '' | CompanyRoleName | string; label: string };

type Params = {
  /** Omezí nabídku pouze na vyjmenované role (po dedupu a ordenaci zachová pořadí include). */
  include?: (CompanyRoleName | string)[];
  /** Skryje vybrané role (aplikuje se až po include). */
  exclude?: (CompanyRoleName | string)[];
  /** Přidá první položku „— Vše —“ s value ''. */
  withAll?: boolean;
  /** i18n namespaces, default ['team','common'] */
  namespaces?: string[];
};

export function useRoleOptions({
  include,
  exclude,
  withAll,
  namespaces = ['team', 'common'],
}: Params = {}): RoleOption[] {
  const { t, i18n } = useTranslation(namespaces);

  return React.useMemo<RoleOption[]>(() => {
    const includeSet = include ? new Set(include.map(String)) : null;
    const excludeSet = exclude ? new Set(exclude.map(String)) : null;

    // 1) Základní zdroj pravdy pro role (FE whitelist z RBAC 2.1)
    const base = (includeSet
      ? ROLE_WHITELIST.filter(r => includeSet.has(String(r)))
      : ROLE_WHITELIST
    ).filter(r => !excludeSet?.has(String(r)));

    // 2) Mapování na options + i18n fallback
    const mapped = base.map<RoleOption>((r) => ({
      value: r,
      label: t(`roles.${r}`, { defaultValue: humanizeRole(String(r)) }),
    }));

    // 3) Volitelná položka „— Vše —“
    const withAllOption: RoleOption[] = withAll
      ? [{ value: '', label: t('datatable.filter.all', { defaultValue: '— Vše —' }) }, ...mapped]
      : mapped;

    // 4) Bezpečná deduplikace podle value (pro případ kolizí z include)
    const seen = new Set<string>();
    const deduped: RoleOption[] = [];
    for (const opt of withAllOption) {
      const key = String(opt.value);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(opt);
    }

    return deduped;
    // Pozn.: závislosti — stringifikujeme include/exclude kvůli setům
  }, [
    t,
    i18n.language,
    JSON.stringify(include ?? []),
    JSON.stringify(exclude ?? []),
    withAll,
  ]);
}
