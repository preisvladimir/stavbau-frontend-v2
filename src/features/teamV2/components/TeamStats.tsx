// revize 13.10.2025
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { UUID } from '../api/types';
import type { CompanyRoleName } from '@/types/common/rbac';
import { VISIBLE_ROLES } from '@/types/common/rbac';
import { teamService } from '../api/team-service';
import LoadErrorStatus from '@/components/ui/stavbau-ui/feedback/LoadErrorStatus';
import { cn } from '@/lib/utils/cn';

type MembersStatsDto = {
  owners: number;
  active: number;
  invited: number;
  disabled: number;
  archived: number;
  total: number;
  byRole: Partial<Record<CompanyRoleName, number>>;
};

export type TeamStatsProps = {
  companyId: UUID | string;

  /** i18n namespaces; default: ['team', 'common'] */
  i18nNamespaces?: string[];

  /** Auto-refresh v milisekundách; např. 30000 = každých 30 s, false/undefined = vypnuto */
  autoRefreshMs?: number | false;

  /** CSS class pro wrapper */
  className?: string;

  /** Umožní přepsat pořadí nebo množinu rolí (jinak se použije VISIBLE_ROLES) */
  rolesOrder?: ReadonlyArray<CompanyRoleName>;

  /** Kliknutí na statistiku (např. otevřít filtr v tabulce) */
  onClickStat?: (key: keyof MembersStatsDto) => void;

  /** Kliknutí na konkrétní roli */
  onClickRole?: (role: CompanyRoleName) => void;
};

export default function TeamStats({
  companyId,
  i18nNamespaces,
  autoRefreshMs = false,
  className,
  rolesOrder,
  onClickStat,
  onClickRole,
}: TeamStatsProps) {
  const { t } = useTranslation(i18nNamespaces ?? ['team', 'common']);
  const svc = React.useMemo(() => teamService(companyId), [companyId]);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<MembersStatsDto | null>(null);

  const fetchStats = React.useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await svc.stats({ signal });
      setStats(data as MembersStatsDto);
    } catch (e: any) {
      // mapAndThrow v service už chybu překládá; pro UI zobrazíme jen message/detail
      setError(e?.message ?? 'Failed to load');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [svc]);

  // initial load + cleanup
  React.useEffect(() => {
    const ac = new AbortController();
    fetchStats(ac.signal);
    return () => ac.abort();
  }, [fetchStats]);

  // optional auto refresh
  React.useEffect(() => {
    if (!autoRefreshMs || autoRefreshMs <= 0) return;
    const id = setInterval(() => {
      const ac = new AbortController();
      fetchStats(ac.signal);
    }, autoRefreshMs);
    return () => clearInterval(id);
  }, [autoRefreshMs, fetchStats]);

  const roleKeys: ReadonlyArray<CompanyRoleName> = React.useMemo(
    () => rolesOrder ?? VISIBLE_ROLES,
    [rolesOrder]
  );

  // Skeleton box
 // const Skel = ({ className = '' }: { className?: string }) => (
 //   <div className={cn('animate-pulse rounded-md bg-gray-100', className)} />
 // );

  return (
    <section className={cn('rounded-xl border bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">
          {t('stats.title', { defaultValue: 'Statistiky týmu' })}
        </h3>
        <div className="text-xs text-gray-500">
          {t('stats.updatedHint', { defaultValue: 'Aktualizuje se automaticky' })}
        </div>
      </div>

      {/* Error banner */}
      <LoadErrorStatus
        loading={loading}
        error={error}
        i18nNamespaces={i18nNamespaces}
      />

      {/* Content */}
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-6">
        {/* owners */}
        <StatTile
          label={t('stats.owners', { defaultValue: 'Vlastníci' })}
          value={loading ? undefined : stats?.owners ?? 0}
          onClick={() => onClickStat?.('owners')}
          tone="emerald"
        />
        {/* active */}
        <StatTile
          label={t('stats.active', { defaultValue: 'Aktivní' })}
          value={loading ? undefined : stats?.active ?? 0}
          onClick={() => onClickStat?.('active')}
          tone="sky"
        />
        {/* invited */}
        <StatTile
          label={t('stats.invited', { defaultValue: 'Pozvaní' })}
          value={loading ? undefined : stats?.invited ?? 0}
          onClick={() => onClickStat?.('invited')}
          tone="amber"
        />
        {/* disabled */}
        <StatTile
          label={t('stats.disabled', { defaultValue: 'Deaktivovaní' })}
          value={loading ? undefined : stats?.disabled ?? 0}
          onClick={() => onClickStat?.('disabled')}
          tone="gray"
        />
        {/* archived */}
        <StatTile
          label={t('stats.archived', { defaultValue: 'Archivovaní' })}
          value={loading ? undefined : stats?.archived ?? 0}
          onClick={() => onClickStat?.('archived')}
          tone="stone"
        />
        {/* total */}
        <StatTile
          label={t('stats.total', { defaultValue: 'Celkem' })}
          value={loading ? undefined : stats?.total ?? 0}
          onClick={() => onClickStat?.('total')}
          tone="violet"
          highlighted
        />
      </div>

      {/* Role distribution */}
      <div className="px-4 pb-4">
        <div className="mb-2 text-sm font-medium">
          {t('stats.byRole', { defaultValue: 'Podle role' })}
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {roleKeys.map((role) => {
            const count = stats?.byRole?.[role] ?? 0;
            return (
              <RoleRow
                key={role}
                role={role}
                count={loading ? undefined : count}
                label={t(`roles.${role}`, { defaultValue: role })}
                onClick={() => onClickRole?.(role)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ====================================================================== */
/* ==============  Small presentational subcomponents  ================== */
/* ====================================================================== */

function StatTile({
  label,
  value,
  onClick,
  tone = 'gray',
  highlighted = false,
}: {
  label: React.ReactNode;
  value?: number; // undefined => skeleton
  onClick?: () => void;
  tone?: 'emerald' | 'sky' | 'amber' | 'violet' | 'gray' | 'stone';
  highlighted?: boolean;
}) {
  const toneRing =
    tone === 'emerald' ? 'ring-emerald-200' :
      tone === 'sky' ? 'ring-sky-200' :
        tone === 'amber' ? 'ring-amber-200' :
          tone === 'violet' ? 'ring-violet-200' :
            tone === 'stone' ? 'ring-stone-200' :
              'ring-gray-200';

  const ring = highlighted ? `ring-2 ${toneRing}` : 'ring-1 ring-gray-200';
  const cls = cn(
    'rounded-lg border p-3 hover:bg-gray-50 transition-colors',
    ring,
    onClick && 'cursor-pointer'
  );

  return (
    <div className={cls} onClick={onClick}>
      <div className="text-xs text-gray-600">{label}</div>
      {value === undefined ? (
        <div className="mt-1 h-6 w-10 animate-pulse rounded bg-gray-200" />
      ) : (
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      )}
    </div>
  );
}

function RoleRow({
 // role,
  label,
  count,
  onClick,
}: {
  role: CompanyRoleName;
  label: React.ReactNode;
  count?: number; // undefined => skeleton
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left',
        'hover:bg-gray-50 transition-colors'
      )}
      onClick={onClick}
    >
      <span className="text-sm">
        {label}
      </span>
      {count === undefined ? (
        <span className="h-4 w-8 animate-pulse rounded bg-gray-200" />
      ) : (
        <span className="text-sm font-semibold">{count}</span>
      )}
    </button>
  );
}
