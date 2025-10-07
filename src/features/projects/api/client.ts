// src/features/projects/api/client.ts
import { api } from '@/lib/api/client';
import { mapAndThrow } from '@/lib/api/problem';
import { toPageResponse, type PageResponse } from '@/types/PageResponse';
import type {
  ProjectSummaryDto,
  ProjectDto,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectMemberRequest,
  UUID,
} from './types';
import { formToCreateBody, formToUpdateBody } from '../mappers/ProjectsMappers';
import type { AnyProjectFormValues } from '../validation/schemas';
import {
  clamp,
  toInt,
  sanitizeQ,
  isCanceled,
  langHeader,
  compact,
} from '@/lib/api/utils';

// (helpers přesunuty do @/lib/api/utils)
// ------------------------------------------------------
// Endpointy
// ------------------------------------------------------
const base = '/projects';
const projectUrl = (id: UUID) => `${base}/${encodeURIComponent(String(id))}`;
const projectArchiveUrl = (id: UUID) => `${projectUrl(id)}/archive`;
const projectMembersUrl = (id: UUID) => `${projectUrl(id)}/members`;

// ------------------------------------------------------
// Typy volání listingu
// ------------------------------------------------------
export type ListOptions = {
  q?: string;
  page?: number;
  size?: number;
  sort?: string;        // např. "name,asc" | "code,asc"
  signal?: AbortSignal;
  /** Volitelné extra hlavičky (If-None-Match apod.). */
  headers?: Record<string, string>;
  /** Rezerva: kurzorové stránkování v budoucnu */
  cursor?: string;
};

// ------------------------------------------------------
// Listing — doporučený vstupní bod (PageResponse<ProjectSummaryDto>)
// ------------------------------------------------------
export async function listProjectSummaries(
  opts: ListOptions = {}
): Promise<PageResponse<ProjectSummaryDto>> {
  const rawPage = toInt(opts.page, 0);
  const rawSize = toInt(opts.size, 20);
  const page = clamp(rawPage, 0, 1_000_000);
  const size = clamp(rawSize, 1, 100);
  const q = sanitizeQ(opts.q);
  const { signal, headers, sort, cursor } = opts;

  try {
    const params = cursor ? { cursor, q, sort } : { q, page, size, sort };
    const res = await api.get<any>(base, {
      params,
      signal,
      headers: { ...langHeader(), ...headers },
    });

    // Centrální adaptér zachová i raw Spring Page pole
    return toPageResponse<ProjectSummaryDto>(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Listing — původní (RAW Spring Page) pro zpětnou kompatibilitu
//   ⚠️ Preferuj listProjectSummaries výše.
// ------------------------------------------------------
export async function listProjects(opts: ListOptions = {}): Promise<any> {
  const params = {
    q: sanitizeQ(opts.q),
    page: toInt(opts.page, 0),
    size: clamp(toInt(opts.size, 20), 1, 100),
    sort: opts.sort,
    cursor: opts.cursor, // BE zatím ignoruje
  };

  const { signal, headers } = opts;
  try {
    const { data } = await api.get(base, {
      params,
      signal,
      headers: { ...langHeader(), ...headers },
    });
    return data; // RAW Spring Page (content, number, size, totalElements, …)
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Detail
// ------------------------------------------------------
export async function getProject(id: UUID, opts?: { signal?: AbortSignal }): Promise<ProjectDto> {
  try {
    const { data } = await api.get<ProjectDto>(projectUrl(id), {
      signal: opts?.signal,
      headers: langHeader(),
    });
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Create / Update
// ------------------------------------------------------
export async function createProject(body: CreateProjectRequest): Promise<ProjectDto> {
  try {
    const sanitized = compact<CreateProjectRequest>(body);
    const { data } = await api.post<ProjectDto>(base, sanitized, {
      headers: langHeader(),
    });
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function updateProject(id: UUID, body: UpdateProjectRequest): Promise<ProjectDto> {
  try {
    const sanitized = compact<UpdateProjectRequest>(body);
    const { data } = await api.patch<ProjectDto>(projectUrl(id), sanitized, {
      headers: langHeader(),
    });
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Form helpers (využij normalizaci v ../mappers)
// ------------------------------------------------------
export async function createProjectFromForm(v: AnyProjectFormValues): Promise<ProjectDto> {
  return createProject(formToCreateBody(v));
}

export async function updateProjectFromForm(id: UUID, v: AnyProjectFormValues): Promise<ProjectDto> {
  return updateProject(id, formToUpdateBody(v));
}

// ------------------------------------------------------
// Delete / Archive (soft delete preferováno)
// ------------------------------------------------------
export async function deleteProject(id: UUID): Promise<void> {
  try {
    await api.delete<void>(projectUrl(id), { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function archiveProject(id: UUID): Promise<void> {
  try {
    await api.post<void>(projectArchiveUrl(id), null, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Členové projektu (MVP stub – 202/204)
// ------------------------------------------------------
export async function addProjectMember(id: UUID, body: ProjectMemberRequest): Promise<void> {
  try {
    await api.post<void>(projectMembersUrl(id), body, {
      headers: langHeader(),
    });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function removeProjectMember(id: UUID, userId: UUID): Promise<void> {
  try {
    await api.delete<void>(`${projectMembersUrl(id)}/${encodeURIComponent(String(userId))}`, {
      headers: langHeader(),
    });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}
