import type { ProjectDto, CreateProjectRequest, UpdateProjectRequest, ProjectSummaryDto } from "../api/types";
import type { AnyProjectFormValues } from "../validation/schemas";
import { trimToUndef } from "@/lib/utils/strings";
import { normalizeAddressDto } from "@/lib/utils/address";

// ————————————————————————————————————————————————
// Projekty: drobné normalizace payloadu
// ————————————————————————————————————————————————

// Fallback: pokud statusLabel není vyplněn, použijeme status (strojovou hodnotu)
export function normalizeProjectSummary(p: ProjectSummaryDto): ProjectSummaryDto {
  return {
    ...p,
    statusLabel: p.statusLabel ?? p.status,
  };
}

export function normalizeProject(p: ProjectDto): ProjectDto {
  return {
    ...p,
    statusLabel: p.statusLabel ?? p.status,
  };
}

/** Form → Create payload (undefined = neposílat) */
export function formToCreateBody(v: AnyProjectFormValues): CreateProjectRequest {
  return {
    //code: trimToUndef(v.code),
    name: v.name, // required ve schématu
    description: trimToUndef(v.description),
    customerId: v.customerId, // required ve schématu
    projectManagerId: trimToUndef(v.projectManagerId),
    plannedStartDate: trimToUndef(v.plannedStartDate),
    plannedEndDate: trimToUndef(v.plannedEndDate),
    currency: trimToUndef(v.currency),
    vatMode: trimToUndef(v.vatMode),
    siteAddress: normalizeAddressDto(v.siteAddress as any),
  };
}

/** Form → Update payload (PATCH sémantika: undefined = beze změny) */
export function formToUpdateBody(v: AnyProjectFormValues): UpdateProjectRequest {
  return {
   // code: trimToUndef(v.code),
    name: trimToUndef(v.name),
    description: trimToUndef(v.description),
    customerId: trimToUndef(v.customerId),
    projectManagerId: trimToUndef(v.projectManagerId),
    plannedStartDate: trimToUndef(v.plannedStartDate),
    plannedEndDate: trimToUndef(v.plannedEndDate), currency: trimToUndef(v.currency),
    vatMode: trimToUndef(v.vatMode),
    siteAddress: normalizeAddressDto(v.siteAddress as any),
  };
}

/** DTO → defaultValues do formuláře (pro edit) */
export function dtoToFormDefaults(d?: ProjectDto): Partial<AnyProjectFormValues> | undefined {
  if (!d) return undefined;
  return {
    code: d.code ?? "",
    name: d.name ?? "",
    description: d.description ?? undefined,
    customerId: d.customerId ?? "",
    projectManagerId: d.projectManagerId ?? "",
    plannedStartDate: d.plannedStartDate ?? undefined,
    plannedEndDate: d.plannedEndDate ?? undefined,
    currency: d.currency ?? undefined,
    vatMode: d.vatMode ?? undefined,
    siteAddress: d.siteAddress
      ? {
        formatted: d.siteAddress.formatted ?? undefined,
        street: d.siteAddress.street ?? undefined,
        houseNumber: d.siteAddress.houseNumber ?? undefined,
        orientationNumber: d.siteAddress.orientationNumber ?? undefined,
        city: d.siteAddress.city ?? undefined,
        cityPart: d.siteAddress.cityPart ?? undefined,
        postalCode: d.siteAddress.postalCode ?? undefined,
        countryCode: d.siteAddress.countryCode ?? undefined,
        latitude: d.siteAddress.latitude,
        longitude: d.siteAddress.longitude,
        source: d.siteAddress.source,
      }
      : undefined,
  };
}