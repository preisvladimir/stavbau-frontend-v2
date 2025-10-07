// src/components/ui/stavbau-ui/AsyncSearchSelect.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";

type Option = { value: string; label: string };
type Props = {
  value?: string | null;
  onChange: (value: string | null) => void;
  fetchOptions: (q: string, signal?: AbortSignal) => Promise<Option[]>;
  placeholder?: string;
  disabled?: boolean;
  debounceMs?: number;
};

export default function AsyncSearchSelect({
  value, onChange, fetchOptions, placeholder = "Vyhledat…", disabled, debounceMs = 250
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const acRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const debouncedQ = useDebounce(q, debounceMs);

  useEffect(() => {
    if (!open) return;
    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;
    setLoading(true);
    fetchOptions(debouncedQ, ac.signal)
      .then(setOpts)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, open]);

  const current = useMemo(() => opts.find(o => o.value === value), [opts, value]);

    // ✅ zavřít při změně vybrané hodnoty (např. po RHF setValue)
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // ✅ zavřít při kliknutí mimo
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      const target = e.target as Node | null;
      if (target && !rootRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);


  return (
    <div className="relative w-full" ref={rootRef}>
      <button
        type="button"
        className="w-full border rounded-xl px-3 py-2 text-left disabled:opacity-50"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-expanded={open}
      >
        {current?.label ?? placeholder}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow">
          <div className="p-2">
            <input
              autoFocus
              ref={inputRef}
              className="w-full border rounded-lg px-3 py-2"
              placeholder={placeholder}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
            />
          </div>
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Načítám…</div>
          ) : (
            <ul className="max-h-56 overflow-auto">
              {opts.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">Nic nenalezeno</li>
              ) : opts.map(o => (
                <li key={o.value}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      onChange(o.value);
                      // ✅ po výběru zavřít dropdown
                      setOpen(false);
                      inputRef.current?.blur();
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="p-2 text-right">
            <button
              type="button"
              className="text-xs text-gray-500 underline"
              onClick={() => {
                onChange(null);
                // ✅ zavřít i po vymazání výběru
                setOpen(false);
                inputRef.current?.blur();
              }}
            >
              Vymazat výběr
            </button>
          </div>
        </div>
      )}
    </div>
  );
}