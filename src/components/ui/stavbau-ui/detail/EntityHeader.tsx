// src/components/ui/stavbau-ui/detail/EntityHeader.tsx
import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Copy as CopyIcon } from '@/components/icons';

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'muted';

export type Badge = {
  label: React.ReactNode;
  tone?: BadgeTone;
  className?: string;         // přepíše tone, pokud chceš vlastní styly
};

export type MetaItem = {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  value?: React.ReactNode;
  /** Pokud je potřeba kopírovat jinou hodnotu než renderovanou (např. bez formátování) */
  copyValue?: string;
  /** Pokud má mít hodnotu link (mailto:, tel:, http…) */
  href?: string;
};

export type EntityHeaderProps = {
  loading?: boolean;

  /** Titulek – pokud je k dispozici lokalizovaná varianta, pošli do titleLocalized */
  title?: string | null;
  titleLocalized?: string | null;

  /** Sekundární řádek (např. kód, e-mail apod.) */
  subtitle?: React.ReactNode;

  /** Kód/identifikátor – zobrazí se v subtitle řádku s copy tlačítkem; volitelné */
  code?: string | null;
  onCopyCode?: (code: string) => void;

  /** Badge(y) vpravo od titulku (status, typ, apod.) */
  badges?: Badge[];

  /** Meta řádky pod titulkem (ikona + label + hodnota + copy / link) */
  meta?: MetaItem[];

  /** Jak renderovat meta položky: "inline" (label vlevo, hodnota vpravo) nebo "stack" (label nad hodnotou). Default: "inline". */
  metaLayout?: 'inline' | 'stack';

  /** Avatar (inicialy/obrázek) */
  avatar?: {
    src?: string | null;
    alt?: string;
    /** Fallback pro iniciály (např. jméno/kód) – pokud není src */
    initialsFrom?: string | null;
    placeholderChar?: string; // default '•'
  };

  className?: string;
};

export default function EntityHeader({
  loading,
  title,
  titleLocalized,
  subtitle,
  code,
  onCopyCode,
  badges,
  meta,
  metaLayout,
  avatar,
  className,
}: EntityHeaderProps) {
  const displayTitle =
    (titleLocalized && titleLocalized.trim()) ||
    (title && title.trim()) ||
    '—';

  const initials = React.useMemo(() => {
    const src = (avatar?.initialsFrom ?? displayTitle ?? code ?? '').trim();
    if (!src) return avatar?.placeholderChar ?? '•';
    const parts = src.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? src[0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';
    return (String(first) + (String(last) || '')).toUpperCase();
  }, [avatar?.initialsFrom, avatar?.placeholderChar, displayTitle, code]);

  const copy = (val?: string | null) => {
    if (!val) return;
    if (onCopyCode) onCopyCode(val);
    else if (navigator?.clipboard?.writeText) void navigator.clipboard.writeText(val);
  };

  return (
    <div className={cn('flex items-start gap-4', className)}>
      {/* Avatar */}
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-100">
        {loading ? (
          <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200" />
        ) : avatar?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar.src} alt={avatar.alt ?? ''} className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-semibold text-gray-600">{initials}</span>
        )}
      </div>

      {/* Title + badges + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-lg font-semibold">
            {loading ? (
              <span className="inline-block h-5 w-48 animate-pulse rounded bg-gray-200" />
            ) : (
              displayTitle
            )}
          </h2>
          {!loading && badges?.length
            ? badges.map((b, i) => <StatusBadge key={i} {...b} />)
            : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          {/* Subtitle + Copy code */}
          {loading ? (
            <span className="inline-block h-4 w-40 animate-pulse rounded bg-gray-200" />
          ) : (
            <>
              {subtitle ? <span className="font-medium">{subtitle}</span> : null}
              {code ? (
                <>
                  {subtitle ? <span className="opacity-40">•</span> : null}
                  <span className="opacity-70">Kód:</span>
                  <span className="inline-flex items-center gap-1">
                   <span className="font-medium">{code}</span>
                    <button
                      type="button"
                      className="shrink-0 rounded p-1 hover:bg-gray-100"
                      onClick={() => copy(code)}
                      title="Kopírovat kód"
                      aria-label="Kopírovat kód"
                    >
                     <CopyIcon size={14} />
                   </button>
                  </span>
                </>
              ) : null}
            </>
          )}
        </div>

   {/* Meta list */}
   {!!meta?.length && (
     <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
       {meta.map((m, i) =>
         metaLayout === 'stack' ? (
           // --- STACK: label nad hodnotou (na všech breakpointech) ---
           <div key={i} className="flex flex-col gap-1 text-sm">
             <span className="flex items-center gap-1 opacity-70">
               {m.icon}
               {m.label}
             </span>
             <span className="flex items-center gap-2">
               {loading ? (
                 <span className="inline-block h-4 w-48 animate-pulse rounded bg-gray-200" />
               ) : m.href ? (
                 <a href={m.href} className="break-words underline decoration-dotted underline-offset-2">
                   {m.value ?? '—'}
                 </a>
               ) : (
                 <span className="break-words font-medium">{m.value ?? '—'}</span>
               )}
               {!loading && (m.copyValue ?? m.value) ? (
                 <button
                   type="button"
                   className="shrink-0 rounded p-1 hover:bg-gray-100"
                   onClick={() => copy(String(m.copyValue ?? m.value))}
                   title="Kopírovat"
                   aria-label="Kopírovat"
                 >
                   <CopyIcon size={14} />
                 </button>
               ) : null}
             </span>
           </div>
         ) : (
           // --- INLINE (původní layout) ---
           <div key={i} className="flex items-center justify-between gap-3 text-sm">
             <span className="flex min-w-0 items-center gap-1 opacity-70">
               {m.icon}
               {m.label}
             </span>
             <span className="flex min-w-0 items-center gap-2">
               {loading ? (
                 <span className="inline-block h-4 w-28 animate-pulse rounded bg-gray-200" />
               ) : m.href ? (
                 <a href={m.href} className="truncate underline decoration-dotted underline-offset-2">
                   {m.value ?? '—'}
                 </a>
               ) : (
                 <span className="max-w-[280px] truncate font-medium">{m.value ?? '—'}</span>
               )}
               {!loading && (m.copyValue ?? m.value) ? (
                 <button
                   type="button"
                   className="shrink-0 rounded p-1 hover:bg-gray-100"
                   onClick={() => copy(String(m.copyValue ?? m.value))}
                   title="Kopírovat"
                   aria-label="Kopírovat"
                 >
                   <CopyIcon size={14} />
                 </button>
               ) : null}
             </span>
           </div>
         )
       )}
     </div>
   )}
      </div>
    </div>
  );
}

/* ===== Helpers ===== */

function StatusBadge({ label, tone = 'neutral', className }: Badge) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : tone === 'info'
      ? 'bg-sky-50 text-sky-700 ring-sky-200'
      : tone === 'warning'
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : tone === 'danger'
      ? 'bg-red-50 text-red-700 ring-red-200'
      : tone === 'muted'
      ? 'bg-gray-50 text-gray-500 ring-gray-200'
      : 'bg-gray-100 text-gray-700 ring-gray-200';

  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1', toneClass, className)}>
      {label}
    </span>
  );
}
