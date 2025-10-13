// src/features/teamV2/pages/StatsPage.tsx
import * as React from 'react';
// --- UI utils & tokens ---
import { cn } from '@/lib/utils/cn';
import { sbContainer } from '@/components/ui/stavbau-ui/tokens';
import { TableHeader } from '@/components/ui/stavbau-ui/datatable/TableHeader';
import { useTranslation } from 'react-i18next';
import type { UUID } from '../../api/types';
import TeamStats from '../../components/TeamStats';
import { VISIBLE_ROLES, type CompanyRoleName } from '@/rbac';

export type StatsPageProps = {
  companyId: UUID | string;
  /** Volitelně přepíše i18n namespaces (default: ['team', 'common']) */
  i18nNamespaces?: string[];
  /** Auto-refresh v ms (default: 30s) – vypnout nastav na false */
  autoRefreshMs?: number | false;
  /** Volitelné pořadí/filtrace rolí pro blok „Podle role“ */
  rolesOrder?: ReadonlyArray<CompanyRoleName>;
  className?: string;
};

export default function StatsPage({
  companyId,
  i18nNamespaces = ['team', 'common'],
  autoRefreshMs = 30_000,
  rolesOrder = VISIBLE_ROLES, // readonly z RBAC
  //className,
}: StatsPageProps) {
  const { t } = useTranslation(i18nNamespaces);

  // Případné navázání na router/stránku (filtry v Team listu apod.)
  const handleClickStat = React.useCallback((key: keyof Parameters<typeof console.log>[0]) => {
    // TODO: zde můžeš navázat např. navigate('/app/team?status=INVITED')
    // nebo zavolat nějaký orchestrátor, který otevře tabulku s předfiltrováním.
    // Prozatím jen log:
    // eslint-disable-next-line no-console
    console.log('[TeamStats] stat clicked:', key);
  }, []);

  const handleClickRole = React.useCallback((role: CompanyRoleName) => {
    // TODO: navigate('/app/team?role=' + role)
    // eslint-disable-next-line no-console
    console.log('[TeamStats] role clicked:', role);
  }, []);

  return (
    <div className="p-4">
      <div className={cn(sbContainer)}>
        <TableHeader
          title={t('stats.page.title', { defaultValue: 'Statistiky týmu' })}
          subtitle={t('stats.page.subtitle', { defaultValue: 'Týmové statistiky ' })}
          actions={
            <div className="text-sm text-gray-500">
              {autoRefreshMs
                ? t('stats.page.autorefreshOn', { defaultValue: 'Auto-refresh zapnut' })
                : t('stats.page.autorefreshOff', { defaultValue: 'Auto-refresh vypnut' })}
            </div>
          }
        />
        {/* Cards / content */}
        <TeamStats
          companyId={companyId}
          i18nNamespaces={i18nNamespaces}
          autoRefreshMs={autoRefreshMs}
          rolesOrder={rolesOrder}
          onClickStat={handleClickStat as any}
          onClickRole={handleClickRole}
          className="bg-white"
        />
      </div>
    </div>
  );
}
