// src/components/common/AddressBlock.tsx
import * as React from 'react';
import type { AddressDto } from '@/types/common/address';
import { Button } from '@/components/ui/stavbau-ui/button';
import { cn } from '@/lib/utils/cn';

export type AddressBlockProps = {
  title?: React.ReactNode;
  address?: AddressDto | null;
  loading?: boolean;
  className?: string;
  /** Zobrazit badge se zdrojem (USER/ARES/...) */
  showSource?: boolean;
  /** Přidat odkaz na mapu (Google) */
  showMapLink?: boolean;
  /** Kompaktní varianta (menší mezery, 1–2 řádky) */
  compact?: boolean;
};

export function AddressBlock({
  title,
  address,
  loading = false,
  className,
  showSource = true,
  showMapLink = true,
  compact = false,
}: AddressBlockProps) {
  const fullText = React.useMemo(() => {
    if (!address) return '';
    if (address.formatted && address.formatted.trim() !== '') return address.formatted.trim();

    const line1 = [
      address.street,
      [address.houseNumber, address.orientationNumber].filter(Boolean).join('/'),
    ]
      .filter(Boolean)
      .join(' ');

    const line2 = [
      address.postalCode,
      address.cityPart,
      address.city || address.municipalityName,
    ]
      .filter(Boolean)
      .join(' ');

    const line3 = [
      address.districtName,
      address.regionName,
      address.countryName || address.countryCode,
    ]
      .filter(Boolean)
      .join(', ');

    return [line1, line2, line3].filter((x) => x && x.trim() !== '').join('\n');
  }, [address]);

  const copy = () => {
    if (!fullText) return;
    void navigator.clipboard?.writeText(fullText);
  };

  const mapHref = React.useMemo(() => {
    if (!showMapLink || !address) return null;
    if (address.latitude != null && address.longitude != null) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${address.latitude},${address.longitude}`
      )}`;
    }
    if (fullText) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        fullText.replace(/\n/g, ' ')
      )}`;
    }
    return null;
  }, [showMapLink, address, fullText]);

  return (
    <div className={cn('rounded-xl border p-4', className)}>
      {title ? (
        <div className={cn('mb-2 text-sm font-medium', compact && 'mb-1')}>{title}</div>
      ) : null}

      {/* Content */}
      {loading ? (
        <div className={cn('space-y-2', compact && 'space-y-1')}>
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          {!compact && <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />}
        </div>
      ) : fullText ? (
        <div className={cn('text-sm text-gray-700', compact ? 'whitespace-pre-line' : 'whitespace-pre-line')}>
          {fullText}
        </div>
      ) : (
        <div className="text-sm text-gray-500">—</div>
      )}

      {/* Footer actions */}
      <div className={cn('mt-3 flex flex-wrap items-center gap-2', compact && 'mt-2')}>
        <Button
          size="sm"
          variant="outline"
          onClick={copy}
          disabled={!fullText || loading}
          aria-label="Kopírovat adresu"
        >
          Kopírovat
        </Button>
        {mapHref && (
          <a
            className="text-sm underline decoration-gray-300 underline-offset-2 hover:opacity-80"
            href={mapHref}
            target="_blank"
            rel="noreferrer"
          >
            Otevřít v mapě
          </a>
        )}
        {showSource && address?.source && (
          <span className="ml-auto inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-700 ring-1 ring-gray-200">
            {sourceLabel(address.source)}
          </span>
        )}
      </div>
    </div>
  );
}

function sourceLabel(src: AddressDto['source']) {
  switch (src) {
    case 'USER':
      return 'Uživatel';
    case 'ARES':
      return 'ARES';
    case 'GEO':
      return 'Geokód';
    case 'IMPORT':
      return 'Import';
    default:
      return String(src ?? '');
  }
}

export default AddressBlock;
