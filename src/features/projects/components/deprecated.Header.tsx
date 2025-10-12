// src/features/projects/components/Header.tsx
import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type HeaderProps = {
  loading?: boolean;
  name?: string | null;
  nameLocalized?: string | null;
  code?: string | null;
  status?: string | null;       // "PLANNED" | "IN_PROGRESS" | ...
  statusLabel?: string | null;  // lokalizovaný label (pokud dorazí z BE)
  className?: string;
  onCopyCode?: (code: string) => void; // pokud chceš vlastní telemetry/handler
};

export default function Header({
  loading,
  name,
  nameLocalized,
  code,
  status,
  statusLabel,
  className,
  onCopyCode,
}: HeaderProps) {
  const displayName =
    (nameLocalized && nameLocalized.trim()) || (name && name.trim()) || '—';

  const copyCode = React.useCallback(() => {
    if (!code) return;
    if (onCopyCode) onCopyCode(code);
    else if (navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(code);
    }
  }, [code, onCopyCode]);

  return (
    <div className={cn('flex items-start gap-4', className)}>
      {/* Avatar s iniciálami */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        {loading ? (
          <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200" />
        ) : (
          <span className="text-lg font-semibold text-gray-600">
            {initials(displayName || code || 'P')}
          </span>
        )}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-lg font-semibold">
            {loading ? (
              <span className="inline-block h-5 w-48 animate-pulse rounded bg-gray-200" />
            ) : (
              displayName
            )}
          </h2>
          {!loading && <StatusBadge status={status} label={statusLabel} />}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="opacity-70">Kód:</span>
          {loading ? (
            <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" />
          ) : (
            <>
              <span className="font-medium">{code ?? '—'}</span>
              {code && (
                <button
                  type="button"
                  className="underline decoration-gray-300 underline-offset-2 hover:opacity-80"
                  onClick={copyCode}
                  title="Kopírovat kód"
                >
                  Kopírovat
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== Helpers ========== */

function initials(label?: string): string {
  const src = (label ?? 'P').trim();
  if (!src) return 'P';
  const parts = src.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? src[0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? '';
  return (first + (last || '')).toUpperCase();
}

function StatusBadge({ status, label }: { status?: string | null; label?: string | null }) {
  if (!status && !label) return null;
  const normalized = status ?? '';
  const text = label ?? status ?? '—';

  const tone =
    normalized === 'IN_PROGRESS'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : normalized === 'PLANNED'
      ? 'bg-sky-50 text-sky-700 ring-sky-200'
      : normalized === 'ON_HOLD'
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : normalized === 'DONE'
      ? 'bg-gray-100 text-gray-700 ring-gray-200'
      : normalized === 'ARCHIVED'
      ? 'bg-gray-50 text-gray-500 ring-gray-200'
      : 'bg-gray-100 text-gray-700 ring-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1',
        tone
      )}
    >
      {text}
    </span>
  );
}