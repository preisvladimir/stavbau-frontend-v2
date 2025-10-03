// src/features/projects/hooks/useProjectsStats.ts
import * as React from 'react';
import { listProjects } from '../api/client';

export type ProjectsStats = {
  total?: number;
  planned?: number;
  inProgress?: number;
  onHold?: number;
  done?: number;
  archived?: number;
};

export function useProjectsStats(enabled: boolean) {
  const [stats, setStats] = React.useState<ProjectsStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = React.useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      // využijeme Spring Page -> totalElements bez načítání obsahu
      const page = await listProjects({ page: 0, size: 1 });
      // page.totalElements (raw Spring Page); detailní rozpad stavů přidáme později (BE endpoint)
      setStats({ total: Number(page?.total ?? 0) || 0 });
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  React.useEffect(() => {
    if (enabled) void fetchStats();
  }, [enabled, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
