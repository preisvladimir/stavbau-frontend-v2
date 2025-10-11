// src/components/ui/stavbau-ui/AsyncSearchSelect.tsx
import * as React from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { cn } from "@/lib/utils/cn";

export type Option = { value: string; label: string };

export type OptionsPage = {
  options: Option[];
  hasMore?: boolean;
  nextPage?: number | null;
  total?: number;
  cursor?: string | null;
};

type Labels = {
  placeholder?: string;
  searching?: string;
  empty?: string;
  loadMore?: string;
  clear?: string;
  typeMore?: string;
};

export type FetchOptions = (args: {
  q: string;
  page: number;     // 0-based
  size: number;     // page size
  signal?: AbortSignal;
}) => Promise<OptionsPage>;

type Props = {
  value?: string | null;
  onChange: (value: string | null) => void;

  /** Sjednocený fetcher s objektovými parametry */
  fetchOptions: FetchOptions;
  valueLabel?: string;
  pageSize?: number;
  minChars?: number;
  debounceMs?: number;
  labels?: Labels;

  disabled?: boolean;
  className?: string;
  renderOption?: (o: Option) => React.ReactNode;
};

export default function AsyncSearchSelect({
  value,
  onChange,
  fetchOptions,
  valueLabel,
  pageSize = 10,
  minChars = 0,
  debounceMs = 250,
  labels,
  disabled,
  className,
  renderOption,
}: Props) {
  const L: Required<Labels> = {
    placeholder: labels?.placeholder ?? "Vyhledat…",
    searching: labels?.searching ?? "Načítám…",
    empty: labels?.empty ?? "Nic nenalezeno",
    loadMore: labels?.loadMore ?? "Načíst další",
    clear: labels?.clear ?? "Vymazat výběr",
    typeMore: labels?.typeMore ?? "Napiš ještě pár znaků…",
  };

  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebounce(q, debounceMs);

  const [opts, setOpts] = React.useState<Option[]>([]);
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const acRef = React.useRef<AbortController | null>(null);

  const [activeIndex, setActiveIndex] = React.useState<number>(-1);


  // zavři dropdown po výběru (změně value zvenku)
  React.useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // klik mimo → zavřít
  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      const target = e.target as Node | null;
      if (target && !rootRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // první fetch / reset při změně dotazu
  React.useEffect(() => {
    if (!open) return;

    if (debouncedQ.trim().length < minChars) {
      setOpts([]);
      setHasMore(false);
      setPage(0);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
      setActiveIndex(-1);
      return;
    }

    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    const run = async () => {
      setLoading(true);
      setError(null);
      setPage(0);
      try {
        const res = await fetchOptions({
          q: debouncedQ,
          page: 0,
          size: pageSize,
          signal: ac.signal,
        });

        setOpts(res.options ?? []);
        setHasMore(!!res.hasMore || res.nextPage != null);
        setPage(res.nextPage != null ? res.nextPage : 1);
        setActiveIndex((res.options?.length ?? 0) > 0 ? 0 : -1);
      } catch (e: any) {
        if (!ac.signal.aborted) {
          setError(e?.message ?? "Fetch error");
          setOpts([]);
          setHasMore(false);
          setPage(0);
          setActiveIndex(-1);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, open, pageSize, minChars, fetchOptions]);

  const loadMore = React.useCallback(async () => {
    if (!open || !hasMore || loadingMore) return;
    if (debouncedQ.trim().length < minChars) return;

    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    setLoadingMore(true);
    setError(null);
    try {
      const res = await fetchOptions({
        q: debouncedQ,
        page,
        size: pageSize,
        signal: ac.signal,
      });

      setOpts(prev => [...prev, ...(res.options ?? [])]);
      const nextP = res.nextPage != null ? res.nextPage : page + 1;
      setPage(nextP);
      setHasMore(!!res.hasMore || res.nextPage != null);
    } catch (e: any) {
      if (!ac.signal.aborted) setError(e?.message ?? "Fetch error");
    } finally {
      if (!ac.signal.aborted) setLoadingMore(false);
    }
  }, [open, hasMore, loadingMore, debouncedQ, page, pageSize, minChars, fetchOptions]);

  // auto-load další stránku při doscrollování
  React.useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
      if (nearBottom) void loadMore();
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [open, loadMore]);

  const onKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, opts.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < opts.length) {
        onChange(opts[activeIndex].value);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const current = React.useMemo(() => opts.find(o => o.value === value), [opts, value]);

  return (
    <div className={cn("relative w-full", className)} ref={rootRef}>
      <button
        type="button"
        className={cn("w-full rounded-xl border px-3 py-2 text-left", "disabled:opacity-50")}
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
         {current?.label ?? (value ? valueLabel : undefined) ?? L.placeholder}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow">
          <div className="p-2">
            <input
              autoFocus
              ref={inputRef}
              className="w-full rounded-lg border px-3 py-2"
              placeholder={L.placeholder}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={onKeyDownInput}
            />
          </div>

          {debouncedQ.trim().length < minChars ? (
            <div className="px-3 py-2 text-sm text-gray-500">{L.typeMore}</div>
          ) : loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">{L.searching}</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : (
            <>
              <ul ref={listRef} role="listbox" className="max-h-56 overflow-auto outline-none" tabIndex={-1}>
                {opts.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-gray-500">{L.empty}</li>
                ) : (
                  opts.map((o, idx) => {
                    const active = idx === activeIndex;
                    return (
                      <li key={o.value} role="option" aria-selected={active}>
                        <button
                          type="button"
                          className={cn("w-full px-3 py-2 text-left hover:bg-gray-50", active && "bg-gray-50")}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => {
                            onChange(o.value);
                            setOpen(false);
                            inputRef.current?.blur();
                          }}
                        >
                          {renderOption ? renderOption(o) : o.label}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>

              <div className="flex items-center justify-between gap-2 p-2">
                <div>
                  {hasMore && (
                    <button
                      type="button"
                      className="text-xs underline decoration-gray-300 underline-offset-2 hover:opacity-80 disabled:opacity-50"
                      onClick={() => void loadMore()}
                      disabled={loadingMore}
                    >
                      {loadingMore ? L.searching : L.loadMore}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs text-gray-500 underline underline-offset-2 hover:opacity-80"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                    inputRef.current?.blur();
                  }}
                >
                  {L.clear}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
