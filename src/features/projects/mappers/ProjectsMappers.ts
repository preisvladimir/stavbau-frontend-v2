// src/features/projects/mappers/ProjectsMappers.ts
import type { ProjectDto, CreateProjectRequest, UpdateProjectRequest } from '../api/types';
import type { AnyProjectFormValues } from '../validation/schemas';

import { trimToUndef } from '@/lib/utils/strings';
import { normalizeAddressDto } from '@/lib/utils/address';

// --- DTO -> Form defaults --------------------------------------------------

/** DTO → Form defaults (edit) */
export function dtoToFormDefaults(p: Partial<ProjectDto>): Partial<AnyProjectFormValues> {
  return {
    name: p?.name ?? '',
    code: p?.code ?? '',
    description: p?.description ?? '',
    plannedStartDate: p?.plannedStartDate ?? '',
    plannedEndDate: p?.plannedEndDate ?? '',
    currency: p?.currency ?? '',
    vatMode: p?.vatMode ?? '',
    siteAddress: normalizeAddressDto(p?.siteAddress as any), // prázdné → undefined
    customerId: p?.customerId ?? '',
    projectManagerId: p?.projectManagerId ?? '',
    // labely pro AsyncSearchSelect (pomocné nevalidované hodnoty)
    customerLabel: p?.customerName ?? undefined,
    projectManagerLabel: p?.projectManagerName ?? undefined,
  };
}

// --- Form -> API bodies ----------------------------------------------------

/** Form → Create body (typově přesně CreateProjectRequest) */
export function formToCreateBody(v: AnyProjectFormValues): CreateProjectRequest {
  return {
    name: v.name.trim(),                  // povinné
    customerId: v.customerId,             // povinné (string) – hlídá schema
    // volitelná pole:
    code: trimToUndef((v as any).code),
    description: trimToUndef(v.description),
    projectManagerId: trimToUndef(v.projectManagerId),
    plannedStartDate: trimToUndef(v.plannedStartDate),
    plannedEndDate: trimToUndef(v.plannedEndDate),
    currency: trimToUndef(v.currency),
    vatMode: trimToUndef(v.vatMode),
    siteAddress: normalizeAddressDto(v.siteAddress as any),
  };
}

/** Form → Update body (typově přesně UpdateProjectRequest) */
export function formToUpdateBody(v: AnyProjectFormValues): UpdateProjectRequest {
  return {
    // na update bývá většina polí volitelná
    name: trimToUndef(v.name),
    code: trimToUndef((v as any).code),
    description: trimToUndef(v.description),
    customerId: trimToUndef(v.customerId),             // pokud je API umožní měnit
    projectManagerId: trimToUndef(v.projectManagerId),
    plannedStartDate: trimToUndef(v.plannedStartDate),
    plannedEndDate: trimToUndef(v.plannedEndDate),
    currency: trimToUndef(v.currency),
    vatMode: trimToUndef(v.vatMode),
    siteAddress: normalizeAddressDto(v.siteAddress as any),
  };
}
