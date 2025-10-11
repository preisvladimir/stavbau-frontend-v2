// src/features/projects/api/client.ts
import { api } from '@/lib/api/client';
import { mapAndThrow } from '@/lib/api/problem';
import { toPageResponse, type PageResponse } from '@/lib/api/types/PageResponse';
import type {
  ProjectSummaryDto,
  ProjectDto,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectMemberRequest,
  UUID,
} from './types';
import { isCanceled, langHeader, compact, sanitizeQ } from '@/lib/api/utils';
import type { DataTableV2Sort } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';
import {
  projectsListUrl,
  projectUrl,
  projectArchiveUrl,
  projectUnarchiveUrl,
  projectDeleteUrl,
  projectMemberUrl,
  // projectsLookupUrl, // pokud používáš lookup endpoint
} from './project-paths';

/** ------------------------------------------------------
 *  Typy a pomocníci
 * ------------------------------------------------------ */
export type ListProjectsParams = {
  q?: string;
  page?: number;              // 0-based
  size?: number;              // default 20
  sort?: string | string[];   // opakované ?sort=...
  status?: string;
  signal?: AbortSignal;
};

export function toSortParams(sort: DataTableV2Sort | null | undefined): string[] {
  // default držíme konzistentní s BE policy
  if (!sort || sort.length === 0) return ['createdAt,desc'];
  return sort.map(s => `${s.id},${s.desc ? 'desc' : 'asc'}`);
}

/** ------------------------------------------------------
 *  Seznam (paged) → sjednocení na FE PageResponse<T>
 * ------------------------------------------------------ */
export async function listProjectsSummaries(
  companyId: UUID | string,
  params: ListProjectsParams = {}
): Promise<PageResponse<ProjectSummaryDto>> {
  const {
    q,
    page = 0,
    size = 20,
    sort = 'createdAt,desc',
    status,
    signal,
  } = params;

  const finalSort = Array.isArray(sort) ? sort : [sort];

  const sp = new URLSearchParams();
  if (q != null) sp.set('q', sanitizeQ(q));
  if (status) sp.set('status', status);
  sp.set('page', String(Math.max(0, page)));
  sp.set('size', String(Math.max(1, size)));
  for (const s of finalSort) sp.append('sort', s);

  try {
    const { data } = await api.get(`${projectsListUrl(companyId)}?${sp.toString()}`, {
      signal,
      headers: langHeader(),
    });
    return toPageResponse<ProjectSummaryDto>(data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** ------------------------------------------------------
 *  Detail
 * ------------------------------------------------------ */
export async function getProject(companyId: UUID, projectId: UUID, opts?: { signal?: AbortSignal }) {
  try {
    const { data } = await api.get<ProjectDto>(projectUrl(companyId, projectId), {
      signal: opts?.signal,
      headers: langHeader(),
    });
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** ------------------------------------------------------
 *  Create / Update
 * ------------------------------------------------------ */
export async function createProject(
  companyId: UUID | string,
  body: CreateProjectRequest
): Promise<void> {
  try {
    const sanitized = compact<CreateProjectRequest>(body);
    await api.post<void>(projectsListUrl(companyId), sanitized, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function updateProject(
  companyId: UUID | string,
  id: UUID,
  body: UpdateProjectRequest
): Promise<void> {
  try {
    const sanitized = compact<UpdateProjectRequest>(body);
    await api.patch<void>(projectUrl(companyId, id), sanitized, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** ------------------------------------------------------
 *  Delete / Archive / Unarchive
 * ------------------------------------------------------ */
export async function deleteProject(companyId: UUID | string, id: UUID): Promise<void> {
  try {
    await api.delete<void>(projectDeleteUrl(companyId, id), { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function archiveProject(companyId: UUID | string, id: UUID): Promise<void> {
  try {
    await api.post<void>(projectArchiveUrl(companyId, id), undefined, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function unarchiveProject(companyId: UUID | string, id: UUID): Promise<void> {
  try {
    await api.post<void>(projectUnarchiveUrl(companyId, id), undefined, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** ------------------------------------------------------
 *  Členové projektu (MVP)
 * ------------------------------------------------------ */
export async function addProjectMember(
  companyId: UUID,
  projectId: UUID,
  userId: UUID,
  body: ProjectMemberRequest
): Promise<void> {
  try {
    await api.post<void>(projectMemberUrl(companyId, projectId, userId), body, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function removeProjectMember(
  companyId: UUID,
  projectId: UUID,
  userId: UUID
): Promise<void> {
  try {
    await api.delete<void>(projectMemberUrl(companyId, projectId, userId), { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}
