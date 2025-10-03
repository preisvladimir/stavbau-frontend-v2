// src/features/projects/mappers/ProjectsMappers.ts
import type { PageResponse } from "@/types/PageResponse";
import type { ProjectDto, ProjectSummaryDto } from "../api/types";

// Minimální tvar Spring Page z BE
export type SpringPage<T> = {
  content: T[];
  number: number;        // current page index (0-based)
  size: number;          // page size
  totalElements: number; // total items
};

export function adaptSpringPage<T>(page: SpringPage<T>): PageResponse<T> {
  return {
    items: page.content ?? [],
    page: page.number ?? 0,
    size: page.size ?? 0,
    total: page.totalElements ?? 0,
  };
}

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
