import * as React from 'react';
import { getMembersStats } from '../api/client';
import type { MembersStatsDto, UUID } from '../api/types';

export function useMembersStats(companyId: UUID | null, enabled = true) {
  
  const [stats, setStats] = React.useState<MembersStatsDto | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!companyId || !enabled) return;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    getMembersStats(companyId, { signal: ac.signal })
      .then(setStats)
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [companyId, enabled]);

  return { stats, loading, error };
}
