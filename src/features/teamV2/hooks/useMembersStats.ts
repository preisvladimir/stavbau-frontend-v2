// src/features/teamV2/hooks/useMembersStats.ts
import * as React from 'react';
import type { MembersStatsDto, UUID } from '../api/types';
import { teamService } from '@/features/teamV2/api/team-service';

export function useMembersStats(companyId: UUID | null, enabled = true) {
  const service = React.useMemo(() => (companyId ? teamService(companyId) : null), [companyId]);

  const [stats, setStats] = React.useState<MembersStatsDto | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (signal?: AbortSignal) => {
    if (!service) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await service.stats({ signal });
      setStats(data);
      return data;
    } catch (e: any) {
      // respektuj abort
      if (signal?.aborted) return null;
      setError(e?.message ?? 'Failed to load');
      return null;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [service]);

  React.useEffect(() => {
    if (!service || !enabled) {
      // volitelně: čistka při disable/změně companyId
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [service, enabled, load]);

  // ruční reload pro UI
  const refetch = React.useCallback(() => load(), [load]);

  return { stats, loading, error, refetch };
}
