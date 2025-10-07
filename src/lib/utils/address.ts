import type { AddressDto } from "@/types/common/address";
import { trimToUndef } from "./strings";

/** Vrátí true, pokud objekt obsahuje alespoň jednu ne-prázdnou hodnotu. */
export function hasAnyValue(o: Record<string, any>): boolean {
  return Object.values(o).some(
    (v) => v !== undefined && v !== null && (typeof v !== "string" || v.length > 0)
  );
}

/**
 * Normalizace adresy: trim hodnot, prázdné → undefined.
 * Když jsou všechny položky prázdné, vrátí undefined (PATCH sémantika).
 */
export function normalizeAddressDto(
  a?: Partial<AddressDto> | null
): AddressDto | undefined {
  if (!a) return undefined;
  const b: AddressDto = {
    formatted: trimToUndef(a.formatted),
    street: trimToUndef(a.street),
    houseNumber: trimToUndef(a.houseNumber),
    orientationNumber: trimToUndef(a.orientationNumber),
    city: trimToUndef(a.city),
    cityPart: trimToUndef(a.cityPart),
    postalCode: trimToUndef(a.postalCode),
    countryCode: trimToUndef(a.countryCode),
    latitude: a.latitude,
    longitude: a.longitude,
    source: a.source,
  };
  return hasAnyValue(b) ? b : undefined;
}