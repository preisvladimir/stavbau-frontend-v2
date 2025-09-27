// src/features/integrations/geo/useGeoSuggest.ts
import { useEffect, useState } from "react";
import { type AddressSuggestion, geoSuggest } from "@/lib/api/geo";

export function useGeoSuggest(query: string, opts?: { limit?: number; lang?: string; debounceMs?: number }) {
  const { limit = 7, lang = "cs", debounceMs = 350 } = opts ?? {};
  const [data, setData] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // jednoduchý debounce bez knihoven
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setData([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await geoSuggest(debouncedQuery, limit, lang);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, limit, lang]);

  return { data, loading, error };
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
