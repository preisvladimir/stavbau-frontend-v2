// src/features/teamV2/api/team-service.ts
import type {
  UUID,
  MemberSummaryDto,
  MemberDto,
  CreateMemberRequest,
  UpdateMemberProfileRequest,
} from './types';

import { createRestService } from '@/lib/api/restService';
import { api } from '@/lib/api/client';
import { langHeader, isCanceled } from '@/lib/api/utils';
import { mapAndThrow } from '@/lib/api/problem';

import {
  membersListUrl as base,
  memberUrl as item,
  membersLookupUrl as lookup,
  memberArchiveUrl as archive,
  memberUnarchiveUrl as unarchive,
  memberProfileUrl,
  memberRoleUrl,
} from './team-paths';

export type TeamFilters = { role?: string; status?: string };

// ------------------------------------------------------
// 1) „Core“ service z generiky (NEcurried) – metody berou `companyId` jako 1. parametr
// ------------------------------------------------------
const core = createRestService<
  UUID,
  TeamFilters,
  MemberSummaryDto,
  MemberDto,
  CreateMemberRequest,
  UpdateMemberProfileRequest
>({
  paths: {
    base,                // (companyId) => /company/{id}/members
    item,                // (companyId, id) => /.../{id}
    lookup,              // (companyId) => /.../lookup
    archive,             // (companyId, id) => POST /.../{id}/archive
    unarchive,           // (companyId, id) => POST /.../{id}/unarchive
    remove: item,        // (companyId, id) => DELETE /.../{id}
  },
  defaultSort: 'lastName,asc',
  filtersToQuery: (f) => ({
    role: f.role?.trim() || undefined,
    status: f.status?.trim() || undefined,
  }),
});

// ------------------------------------------------------
// 2) Wrapper navázaný na konkrétní companyId
//    (získáš stejné API jako dřív, jen bez TS2349)
// ------------------------------------------------------
export const teamService = (companyId: UUID | string) => {
  const cid = String(companyId);

  return {
    // ---- generické CRUD/list/lookup z core, navázané na firmu ----
    list: (params?: Parameters<typeof core.list>[1]) =>
      core.list(cid, params),

    lookup: (params?: Parameters<typeof core.lookup>[1]) =>
      core.lookup(cid, params),

    get: (id: UUID, opts?: Parameters<typeof core.get>[2]) =>
      core.get(cid, id, opts),

    create: (body: CreateMemberRequest) =>
      core.create(cid, body),

    update: (id: UUID, body: UpdateMemberProfileRequest) =>
      core.update(cid, id, body),

    archive: (id: UUID) =>
      core.archive(cid, id),

    unarchive: (id: UUID) =>
      core.unarchive(cid, id),

    remove: (id: UUID) =>
      core.remove(cid, id),

    pagedLookupFetcher: (sort?: string | string[]) =>
      core.pagedLookupFetcher(cid, sort),

    // ---- doménové PATCHy (mimo generiku) ----
    async updateProfile(id: UUID, body: UpdateMemberProfileRequest, opts?: { signal?: AbortSignal }) {
      try {
        await api.patch<void>(memberProfileUrl(cid, id), body, {
          signal: opts?.signal,
          headers: langHeader(),
        });
      } catch (e) {
        if (isCanceled(e)) throw e;
        mapAndThrow(e);
      }
    },

    async updateRole(id: UUID, body: { role: string }, opts?: { signal?: AbortSignal }) {
      try {
        await api.patch<void>(memberRoleUrl(cid, id), body, {
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

// ------------------------------------------------------
// 3) Helper pro <AsyncSearchSelect/> – rovnou se vrať s fetcher funkcí
// ------------------------------------------------------
export const pagedTeamFetcher = (companyId: UUID | string) =>
  core.pagedLookupFetcher(String(companyId), 'lastName,asc');
