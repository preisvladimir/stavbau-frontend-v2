// src/features/customers/mappers.ts
import type { CustomerDto, CreateCustomerRequest, UpdateCustomerRequest } from "./api/types";
import type { CustomerFormValues } from "./components/CustomerForm";
import type { AddressDto } from "@/types/common/address";

// pomocná normalizace adresy: trim řetězců, prázdné → undefined, pokud je vše prázdné → undefined
const normalizeAddress = (
  a?: CustomerFormValues["billingAddress"]
): AddressDto | undefined => {
  if (!a) return undefined;
  const b: AddressDto = {
    formatted: a.formatted?.trim() || undefined,
    street: a.street?.trim() || undefined,
    houseNumber: a.houseNumber?.trim() || undefined,
    orientationNumber: a.orientationNumber?.trim() || undefined,
    city: a.city?.trim() || undefined,
    cityPart: a.cityPart?.trim() || undefined,
    postalCode: a.postalCode?.trim() || undefined,
    countryCode: a.countryCode?.trim() || undefined,
    latitude: a.latitude,
    longitude: a.longitude,
    source: a.source,
  };
  const hasAny =
    Object.values(b).some(v => v !== undefined && v !== null && (typeof v !== "string" || v.length > 0));
  return hasAny ? b : undefined;
};

export function formToCreateBody(v: CustomerFormValues): CreateCustomerRequest {
  return {
    type: v.type,
    name: v.name,
    ico: v.ico || undefined,
    dic: v.dic || undefined,
    email: v.email || undefined,
    phone: v.phone || undefined,
    billingAddress: normalizeAddress(v.billingAddress), // ← typed AddressDto
    defaultPaymentTermsDays: v.defaultPaymentTermsDays ?? undefined,
    notes: v.notes || undefined,
  };
}

export function formToUpdateBody(v: CustomerFormValues): UpdateCustomerRequest {
  // PATCH sémantika: undefined = beze změny, objekt = přepiš
  return {
    type: v.type,
    name: v.name,
    ico: v.ico || undefined,
    dic: v.dic || undefined,
    email: v.email || undefined,
    phone: v.phone || undefined,
    billingAddress: normalizeAddress(v.billingAddress), // pokud undefined → BE nic nemění
    defaultPaymentTermsDays: v.defaultPaymentTermsDays ?? undefined,
    notes: v.notes || undefined,
  };
}

export function dtoToFormDefaults(d?: CustomerDto): Partial<CustomerFormValues> | undefined {
  if (!d) return undefined;
  return {
    type: d.type ?? "ORGANIZATION",
    name: d.name ?? "",
    ico: d.ico ?? undefined,
    dic: d.dic ?? undefined,
    email: d.email ?? undefined,
    phone: d.phone ?? undefined,
    // typed billingAddress jde rovnou do formuláře
    billingAddress: d.billingAddress
      ? {
          formatted: d.billingAddress.formatted ?? undefined,
          street: d.billingAddress.street ?? undefined,
          houseNumber: d.billingAddress.houseNumber ?? undefined,
          orientationNumber: d.billingAddress.orientationNumber ?? undefined,
          city: d.billingAddress.city ?? undefined,
          cityPart: d.billingAddress.cityPart ?? undefined,
          postalCode: d.billingAddress.postalCode ?? undefined,
          countryCode: d.billingAddress.countryCode ?? undefined,
          latitude: d.billingAddress.latitude,
          longitude: d.billingAddress.longitude,
          source: d.billingAddress.source,
        }
      : undefined,
    defaultPaymentTermsDays: d.defaultPaymentTermsDays ?? undefined,
    notes: d.notes ?? undefined,
  };
}
