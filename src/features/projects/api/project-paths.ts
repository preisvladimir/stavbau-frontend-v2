// src/features/projects/api/project-paths.ts
//revize 13.10.2025
import type { UUID } from "@/types";

/** Základ všech endpoints pro projekty v rámci firmy */
export const projectsBase = (companyId: UUID | string) =>
  `/company/${encodeURIComponent(String(companyId))}/projects`;

/** List (paged) */
export const projectsListUrl = (companyId: UUID | string) =>
  projectsBase(companyId);

/** (Volitelně) Lookup pro selecty – pokud máš na BE /projects/lookup */
export const projectsLookupUrl = (companyId: UUID | string) =>
  `${projectsBase(companyId)}/lookup`;

/** Detail projektu */
export const projectUrl = (companyId: UUID | string, projectId: UUID | string) =>
  `${projectsBase(companyId)}/${encodeURIComponent(String(projectId))}`;

/** Archive / Unarchive */
export const projectArchiveUrl = (companyId: UUID | string, projectId: UUID | string) =>
  `${projectUrl(companyId, projectId)}/archive`;

export const projectUnarchiveUrl = (companyId: UUID | string, projectId: UUID | string) =>
  `${projectUrl(companyId, projectId)}/unarchive`;

/** Delete (hard) */
export const projectDeleteUrl = (companyId: UUID | string, projectId: UUID | string) =>
  projectUrl(companyId, projectId);

/** Členové projektu (pokud používáš /projects/{id}/members/{userId}) */
export const projectMemberUrl = (
  companyId: UUID | string,
  projectId: UUID | string,
  userId: UUID | string
) =>
  `${projectsBase(companyId)}/${encodeURIComponent(String(projectId))}/members/${encodeURIComponent(
    String(userId)
  )}`;

/** (Volitelně) kolekce členů projektu */
export const projectMembersUrl = (companyId: UUID | string, projectId: UUID | string) =>
  `${projectsBase(companyId)}/${encodeURIComponent(String(projectId))}/members`;
