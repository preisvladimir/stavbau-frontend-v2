import type { ProjectDto, ProjectSummaryDto } from "../api/types";

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
