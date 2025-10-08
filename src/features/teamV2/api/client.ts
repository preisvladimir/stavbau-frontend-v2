// src/features/teamV2/api/client.ts
// Server-side paging/sorting/search ve stejném duchu jako Projects
import { api } from '@/lib/api/client';
import { mapAndThrow } from '@/lib/api/problem';
import { toPageResponse, type PageResponse } from '@/lib/api/types/PageResponse';
import { isCanceled, langHeader, compact, sanitizeQ } from '@/lib/api/utils';
import type { DataTableV2Sort } from '@/components/ui/stavbau-ui/datatable/datatable-v2-core';
import type {
  MemberSummaryDto,
  UUID,
  CreateMemberRequest,
  UpdateMemberProfileRequest,
  UpdateMemberRoleRequest,
} from './types';

/**
 * ------------------------------------------------------
 * Endpoint buildery (jediný zdroj pravdy pro URL)
 * ------------------------------------------------------
 */
const base = (companyId: UUID | string) =>
  `/companies/${encodeURIComponent(String(companyId))}/members`;
const memberUrl = (companyId: UUID | string, id: UUID | string) =>
  `${base(companyId)}/${encodeURIComponent(String(id))}`;
const memberProfileUrl = (companyId: UUID | string, id: UUID | string) =>
  `${memberUrl(companyId, id)}/profile`;
const memberRoleUrl = (companyId: UUID | string, id: UUID | string) =>
  `${memberUrl(companyId, id)}/role`;

/**
 * Vstupní parametry pro server-side list členů.
 * - `page` je 0-based
 * - `sort` může být 1× string, nebo pole (multi-sort)
 * - `signal` pro AbortController (zrušení rozpracovaného dotazu)
 */
export type ListMembersParams = {
  q?: string;
  page?: number;
  size?: number;
  sort?: string | string[];
  role?: string;
  signal?: AbortSignal;
};

/**
 * Adapter z DataTableV2Sort → `["field,asc","other,desc"]`
 * - držíme se konvence `id,asc|desc`
 * - defaultujeme stabilně na `email,asc`
 */
export function toSortParams(sort: DataTableV2Sort | null | undefined): string[] {
  if (!sort || sort.length === 0) return ['email,asc'];
  return sort.map(s => `${s.id},${s.desc ? 'desc' : 'asc'}`);
}

/**
 * Načte stránkovaný seznam členů a sjednotí payload na FE PageResponse<T>.
 * - `sort` serializujeme jako opakovaný parametr: `?sort=a,asc&sort=b,desc`
 * - `q` proženeme přes `sanitizeQ`
 */
export async function listMemberSummaries(
  companyId: UUID | string,
  params: ListMembersParams = {}
): Promise<PageResponse<MemberSummaryDto>> {
  const { q, page = 0, size = 20, sort = 'email,asc', role, signal } = params;
  const finalSort = Array.isArray(sort) ? sort : [sort];

  const sp = new URLSearchParams();
  if (q != null) sp.set('q', sanitizeQ(q));
  if (role) sp.set('role', role);
  sp.set('page', String(Math.max(0, page)));
  sp.set('size', String(Math.max(1, size)));
  for (const s of finalSort) sp.append('sort', s);

  try {
    const { data } = await api.get(`${base(companyId)}?${sp.toString()}`, { signal });
    return toPageResponse<MemberSummaryDto>(data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/**
 * Create member
 */
export async function createMember(
  companyId: UUID | string,
  body: CreateMemberRequest
): Promise<void> {
  try {
    const sanitized = compact<CreateMemberRequest>(body);
    await api.post<void>(base(companyId), sanitized, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/**
 * Update member profile (PATCH)
 */
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

/**
 * Update member role (PATCH)
 */
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

/**
 * Delete member
 */
export async function deleteMember(companyId: UUID | string, id: UUID): Promise<void> {
  try {
    await api.delete<void>(memberUrl(companyId, id), { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}
