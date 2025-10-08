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
import { formToCreateBody, formToUpdateBody } from '../mappers/ProjectsMappers';
import type { AnyProjectFormValues } from '../validation/schemas';
import { isCanceled, langHeader, compact, sanitizeQ } from '@/lib/api/utils';
import type { DataTableV2Sort } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';

/**
 * ------------------------------------------------------
 * Endpoint buildery (jediný zdroj pravdy pro URL)
 * ------------------------------------------------------
 *
 * Pozn.: `api` už má baseURL (např. `/api`) z klienta a interceptory
 * (Authorization + Accept-Language). Tady definujeme pouze path část.
 */
const base = '/projects';
const projectUrl = (id: UUID) => `${base}/${encodeURIComponent(String(id))}`;
const projectArchiveUrl = (id: UUID) => `${projectUrl(id)}/archive`;
const projectMembersUrl = (id: UUID) => `${projectUrl(id)}/members`;

/**
 * Vstupní parametry pro server-side list projek­tů.
 * - `page` je 0-based (shoda se Springem)
 * - `sort` může být 1× string, nebo pole (multi-sort)
 */
export type ListProjectsParams = {
  q?: string;
  page?: number;        // 0-based
  size?: number;        // default 20
  sort?: string | string[]; // BE přijme 1× nebo více `sort` parametrů
};

/**
 * Adapter z DataTableV2Sort → `["field,asc","other,desc"]`
 * - držíme se konvence `id,asc|desc`
 * - defaultujeme na stabilní `code,desc` (FE i BE mají whitelisted)
 */
export function toSortParams(sort: DataTableV2Sort | null | undefined): string[] {
  if (!sort || sort.length === 0) return ['code,desc'];
  return sort.map(s => `${s.id},${s.desc ? 'desc' : 'asc'}`);
}

/**
 * Načte stránkovaný seznam projektů a sjednotí payload na FE PageResponse<T>.
 * - Používáme URLSearchParams, aby se `sort` serializovalo jako opakovaný
 *   parametr (`?sort=a,asc&sort=b,desc`) — žádné `sort[]=...`.
 * - `q` proženeme přes `sanitizeQ` (trim, vyhození řídkých whitespace apod.).
 */
export async function listProjects(
  params: ListProjectsParams = {}
): Promise<PageResponse<ProjectSummaryDto>> {
  const { q, page = 0, size = 20, sort = 'code,desc' } = params;
  const finalSort = Array.isArray(sort) ? sort : [sort];

  const sp = new URLSearchParams();
  if (q != null) sp.set('q', sanitizeQ(q));
  sp.set('page', String(Math.max(0, page)));
  sp.set('size', String(Math.max(1, size)));
  for (const s of finalSort) sp.append('sort', s);

  const { data } = await api.get(`${base}?${sp.toString()}`);
  return toPageResponse<ProjectSummaryDto>(data);
}

/**
 * ------------------------------------------------------
 * Detail projektu
 * ------------------------------------------------------
 * - `langHeader()` pro Content-Language/Accept-Language symetrii
 * - `signal` pro AbortController (zrušení rozpracovaného dotazu)
 */
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

/**
 * ------------------------------------------------------
 * Create / Update
 * ------------------------------------------------------
 * - `compact(...)` odfiltruje undefined/empty hodnoty (čistý payload)
 * - mapování formuláře držíme v separátních mapperech
 */
export async function createProject(body: CreateProjectRequest): Promise<ProjectDto> {
  try {
    const sanitized = compact<CreateProjectRequest>(body);
    const { data } = await api.post<ProjectDto>(base, sanitized, { headers: langHeader() });
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function updateProject(id: UUID, body: UpdateProjectRequest): Promise<ProjectDto> {
  try {
    const sanitized = compact<UpdateProjectRequest>(body);
    const { data } = await api.patch<ProjectDto>(projectUrl(id), sanitized, { headers: langHeader() });
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/**
 * ------------------------------------------------------
 * Form helpers (syntaktický cukr nad mappéry)
 * ------------------------------------------------------
 */
export async function createProjectFromForm(v: AnyProjectFormValues): Promise<ProjectDto> {
  return createProject(formToCreateBody(v));
}

export async function updateProjectFromForm(id: UUID, v: AnyProjectFormValues): Promise<ProjectDto> {
  return updateProject(id, formToUpdateBody(v));
}

/**
 * ------------------------------------------------------
 * Delete / Archive (soft delete preferováno)
 * ------------------------------------------------------
 */
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

/**
 * ------------------------------------------------------
 * Členové projektu (MVP) – očekáváme 202/204
 * ------------------------------------------------------
 */
export async function addProjectMember(id: UUID, body: ProjectMemberRequest): Promise<void> {
  try {
    await api.post<void>(projectMembersUrl(id), body, { headers: langHeader() });
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
