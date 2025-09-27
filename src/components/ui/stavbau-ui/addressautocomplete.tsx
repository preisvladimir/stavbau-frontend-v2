// src/components/ui/stavbau-ui/addressautocomplete.tsx
import { useEffect, useRef, useState } from "react";
import { geoSuggest, type AddressSuggestion } from "@/lib/api/geo";

type Props = {
  value?: string;
  onSelect: (s: AddressSuggestion) => void;
  placeholder?: string;
  lang?: string;
  debounceMs?: number;
  closeOnSelect?: boolean; // nově – default true
};

export function AddressAutocomplete({
  value = "",
  onSelect,
  placeholder = "Zadej adresu",
  lang = "cs",
  debounceMs = 350,
  closeOnSelect = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AddressSuggestion[]>([]);

  // sync externí value -> lokální q
  useEffect(() => setQ(value ?? ""), [value]);

  // jednoduchý debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      const qn = q.trim();
      if (qn.length < 2) {
        setItems([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const data = await geoSuggest(qn, 7, lang);
        setItems(data);
        setOpen(data.length > 0);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(t);
  }, [q, lang, debounceMs]);

  // zavírání při kliknutí mimo
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);

  const handlePick = (s: AddressSuggestion) => {
    onSelect(s);
    // Po výběru zavřít + propsat do inputu
    if (closeOnSelect) {
      setOpen(false);
      setItems([]);
      setQ(s.formatted ?? "");
      // drobná pauza, ať nedojde k „bojům“ focus/blur
      requestAnimationFrame(() => inputRef.current?.blur());
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        className="w-full rounded-xl border px-3 py-2"
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          // psaní znovu otevře panel (pokud budou výsledky)
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
        autoComplete="off"
      />
      {loading && <div className="absolute right-3 top-2.5 text-xs opacity-60">…</div>}

      {open && items.length > 0 && q.trim().length >= 2 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-white shadow"
        >
          {items.map((s, i) => (
            <li
              key={`${s.formatted}-${i}`}
              role="option"
              // ⬇ onMouseDown kvůli tomu, aby blur inputu nezrušil klik
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePick(s);
              }}
              className="cursor-pointer px-3 py-2 hover:bg-gray-50"
              title={s.formatted}
            >
              <div className="text-sm">{s.formatted}</div>
              {(s.zip || s.municipality || s.country) && (
                <div className="text-xs text-gray-500">
                  {s.zip ? `${s.zip} ` : ""}
                  {s.municipality ?? s.region ?? s.country ?? ""}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
