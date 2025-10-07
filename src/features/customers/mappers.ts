// src/features/customers/mappers.ts
import type { CustomerDto, CreateCustomerRequest, UpdateCustomerRequest } from "./api/types";
import type { CustomerFormValues } from "./components/CustomerForm";
import { normalizeAddressDto } from "@/lib/utils/address";

export function formToCreateBody(v: CustomerFormValues): CreateCustomerRequest {
  return {
    type: v.type,
    name: v.name,
    ico: v.ico || undefined,
    dic: v.dic || undefined,
    email: v.email || undefined,
    phone: v.phone || undefined,
    billingAddress: normalizeAddressDto(v.billingAddress as any), // ← typed AddressDto
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
    billingAddress: normalizeAddressDto(v.billingAddress as any), // pokud undefined → BE nic nemění
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
    // typed billingAddress jde rovnou do formuláře (beze změny struktury)
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
