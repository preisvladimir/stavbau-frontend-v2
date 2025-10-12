// src/features/teamV2/api/client.ts
import { api } from '@/lib/api/client';
import { mapAndThrow } from '@/lib/api/problem';
import { pagedLookupFetcher } from '@/lib/api/lookup';
import { toPageResponse, type PageResponse } from '@/lib/api/types/PageResponse';
import { isCanceled, langHeader, compact, sanitizeQ } from '@/lib/api/utils';

import type {
  MemberDto,
  MemberSummaryDto,
  UUID,
  CreateMemberRequest,
  UpdateMemberProfileRequest,
  UpdateMemberRoleRequest,
  MembersStatsDto,
} from './types';

import {
  membersListUrl,
  membersLookupUrl,
  memberUrl,
  memberProfileUrl,
  memberRoleUrl,
  memberArchiveUrl,
  memberUnarchiveUrl,
  membersStatsUrl,
} from './team-paths';


/** Parametry pro page-ované listování členů (server-side) */
export type ListMembersParams = {
  q?: string;
  page?: number;          // 0-based
  size?: number;          // default 10
  sort?: string | string[]; // např. "lastName,asc" nebo ["lastName,asc","user.email,asc"]
  role?: string;
  status?: string;        // BE může ignorovat, pokud nepodporuje
  signal?: AbortSignal;
};

/** Načti seznam členů (paged) a sjednoť na PageResponse<MemberSummaryDto> */
export async function listMemberSummaries(
  companyId: UUID | string,
  params: ListMembersParams = {}
): Promise<PageResponse<MemberSummaryDto>> {
  const { q, page = 0, size = 10, sort = 'lastName,asc', role, status, signal } = params;
  const finalSort = Array.isArray(sort) ? sort : [sort];

  const sp = new URLSearchParams();
  if (q != null) sp.set('q', sanitizeQ(q));
  if (role?.trim()) sp.set('role', role.trim());
  if (status?.trim()) sp.set('status', status.trim());
  sp.set('page', String(Math.max(0, page)));
  sp.set('size', String(Math.max(1, size)));
  for (const s of finalSort) sp.append('sort', s);

  try {
    const { data } = await api.get(`${membersListUrl(companyId)}?${sp.toString()}`, {
      signal,
      headers: langHeader(),
    });
    return toPageResponse<MemberSummaryDto>(data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/* ----------------------------- Detail ------------------------------ */

export async function getMember(
  companyId: UUID,
  memberId: UUID,
  opts?: { signal?: AbortSignal }
) {
  try {
    // GET /members/{id} — detail
    const { data } = await api.get<MemberDto>(memberUrl(companyId, memberId), {
      signal: opts?.signal,
      headers: langHeader(),
    });
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/* --------------------------- Create/Update -------------------------- */

export async function createMember(
  companyId: UUID | string,
  body: CreateMemberRequest
): Promise<void> {
  try {
    const sanitized = compact<CreateMemberRequest>(body);
    await api.post<void>(membersListUrl(companyId), sanitized, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function updateMemberProfile(
  companyId: UUID | string,
  id: UUID,
  body: UpdateMemberProfileRequest
): Promise<void> {
  try {
    const sanitized = compact<UpdateMemberProfileRequest>(body);
    await api.patch<void>(memberProfileUrl(companyId, id), sanitized, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function updateMemberRole(
  companyId: UUID | string,
  id: UUID,
  body: UpdateMemberRoleRequest
): Promise<void> {
  try {
    const sanitized = compact<UpdateMemberRoleRequest>(body);
    await api.patch<void>(memberRoleUrl(companyId, id), sanitized, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/* -------------------------- Delete / Archive ------------------------ */

export async function deleteMember(companyId: UUID | string, id: UUID): Promise<void> {
  try {
    await api.delete<void>(memberUrl(companyId, id), { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function archiveMember(companyId: UUID | string, id: UUID): Promise<void> {
  try {
    await api.post<void>(memberArchiveUrl(companyId, id), null, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function unarchiveMember(companyId: UUID | string, id: UUID): Promise<void> {
  try {
    await api.post<void>(memberUnarchiveUrl(companyId, id), null, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/* ------------------------------- Stats ------------------------------ */

export async function getMembersStats(
  companyId: string,
  opts?: { signal?: AbortSignal }
): Promise<MembersStatsDto> {
  try {
    const { data } = await api.get<MembersStatsDto>(membersStatsUrl(companyId), {
      signal: opts?.signal,
      headers: langHeader(),
    });
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/* ----------------------- Lookup (pro selecty) ----------------------- */
/**
 * Stránkovaný lookup pro AsyncSearchSelect (vrací {value,label}).
 * Preferuj tento endpoint před plným listem – je lehčí.
 */

/** Bez filtru role */
export const pagedTeamFetcher = (companyId: UUID | string) =>
  pagedLookupFetcher(membersLookupUrl(companyId), 'lastName,asc');

/** Jen projektoví manažeři */
export const pagedTeamPmFetcher = (companyId: UUID | string) =>
  pagedLookupFetcher(membersLookupUrl(companyId), 'lastName,asc', { role: 'PROJECT_MANAGER' });
