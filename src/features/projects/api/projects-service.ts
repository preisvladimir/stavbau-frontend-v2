// src/features/projects/api/projects-service.ts
//revizs 13.10.2025
import type { UUID } from "@/types";
import type {
  ProjectSummaryDto,
  ProjectDto,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectMemberRequest,
} from './types';

import { createRestService } from '@/lib/api/restService';
import { api } from '@/lib/api/client';
import { langHeader, isCanceled } from '@/lib/api/utils';
import { mapAndThrow } from '@/lib/api/problem';

import {
  projectsListUrl as base,        // (companyId) => /company/{id}/projects
  projectUrl as item,              // (companyId, id) => /.../{id}
  // Pokud máš lookup endpoint, odkomentuj následující import i položku v paths:
  // projectsLookupUrl as lookup,  // (companyId) => /.../lookup
  projectArchiveUrl as archive,    // (companyId, id) => POST /.../{id}/archive
  projectUnarchiveUrl as unarchive,// (companyId, id) => POST /.../{id}/unarchive
  projectDeleteUrl as remove,      // (companyId, id) => DELETE /.../{id}
  projectMemberUrl,                // (companyId, projectId, userId) => /.../{projectId}/members/{userId}
} from './project-paths';

export type ProjectFilters = { status?: string };

/* -------------------------------------------------------------------------- */
/* 1) „Core“ service z generiky (NE-curried) – metody berou companyId jako 1. */
/* -------------------------------------------------------------------------- */
const core = createRestService<
  UUID,
  ProjectFilters,
  ProjectSummaryDto,
  ProjectDto,
  CreateProjectRequest,
  UpdateProjectRequest
>({
  paths: {
    base,
    item,
    // lookup,               // ← odkomentuj, pokud máš lookup endpoint
    archive,
    unarchive,
    remove,
  },
  defaultSort: 'createdAt,desc',
  filtersToQuery: (f) => ({
    status: f.status?.trim() || undefined,
  }),
});

/* -------------------------------------------------------------------------- */
/* 2) Wrapper navázaný na konkrétní companyId                                  */
/* -------------------------------------------------------------------------- */
export const projectsService = (companyId: UUID | string) => {
  const cid = String(companyId);

  return {
    // ---- generické CRUD/list/lookup z core, navázané na firmu ----
    list: (params?: Parameters<typeof core.list>[1]) =>
      core.list(cid, params),

    // Pokud máš lookup endpoint, odkomentuj i tuto metodu:
    // lookup: (params?: Parameters<typeof core.lookup>[1]) =>
    //   core.lookup(cid, params),

    get: (id: UUID, opts?: Parameters<typeof core.get>[2]) =>
      core.get(cid, id, opts),

    create: (body: CreateProjectRequest) =>
      core.create(cid, body),

    update: (id: UUID, body: UpdateProjectRequest) =>
      core.update(cid, id, body),

    archive: (id: UUID) =>
      core.archive(cid, id),

    unarchive: (id: UUID) =>
      core.unarchive(cid, id),

    remove: (id: UUID) =>
      core.remove(cid, id),

    // Pokud používáš lookup + potřebuješ fetcher pro AsyncSearchSelect:
    pagedLookupFetcher: (sort?: string | string[]) =>
      core.pagedLookupFetcher(cid, sort),

    // ---- doménové metody (členové projektu) ----
    async addMember(projectId: UUID, userId: UUID, body: ProjectMemberRequest, opts?: { signal?: AbortSignal }) {
      try {
        await api.post<void>(projectMemberUrl(cid, projectId, userId), body, {
          signal: opts?.signal,
          headers: langHeader(),
        });
      } catch (e) {
        if (isCanceled(e)) throw e;
        mapAndThrow(e);
      }
    },

    async removeMember(projectId: UUID, userId: UUID, opts?: { signal?: AbortSignal }) {
      try {
        await api.delete<void>(projectMemberUrl(cid, projectId, userId), {
          signal: opts?.signal,
          headers: langHeader(),
        });
      } catch (e) {
        if (isCanceled(e)) throw e;
        mapAndThrow(e);
      }
    },
  };
};

/* -------------------------------------------------------------------------- */
/* 3) Helper pro <AsyncSearchSelect/> – vrať rovnou fetcher funkci             */
/*     (funguje, pokud máš lookup endpoint v paths odkomentovaný)              */
/* -------------------------------------------------------------------------- */
export const pagedProjectsFetcher = (companyId: UUID | string, sort: string | string[] = 'createdAt,desc') =>
  core.pagedLookupFetcher(String(companyId), sort);
