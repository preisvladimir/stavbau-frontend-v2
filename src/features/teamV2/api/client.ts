import { api } from '@/lib/api/client';
import type {
  MembersStatsDto ,
  MemberSummaryDto,
  MemberDto,
  CreateMemberRequest,
  UpdateMemberProfileRequest,
  UpdateMemberRequest,
  UpdateMemberRoleRequest,
  UUID,
} from './types';
import type {PageResponse} from '@/types/PageResponse';
import { type CompanyRoleName, ROLE_WHITELIST } from '@/types/common/rbac';
import { mapAndThrow } from '@/lib/api/problem';

// ------------------------------------------------------
// Helpers (security, DX)
// ------------------------------------------------------
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const toInt = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) | 0 : fallback);
const sanitizeQ = (q?: string) => (q ?? '').trim().slice(0, 200);
// Strongly-typed shallow compact (keeps keyof T)
function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  const out = {} as Partial<T>;
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (v !== null && v !== undefined) {
      // preserve original type of the property
      (out as any)[k] = v;
    }
  });
  return out;
}

/**
 * Base endpoint pro Company members.
 * Pozn.: Axios `api` má baseURL např. `/api/v1` → výsledné volání: /api/v1/tenants/{companyId}/members
 */
export const endpoint = (companyId: string) => `/tenants/${encodeURIComponent(companyId)}/members`;
export const memberUrl = (companyId: string, memberId: string) => `${endpoint(companyId)}/${encodeURIComponent(memberId)}`;
export const memberProfileUrl = (companyId: string, memberId: string) => `${memberUrl(companyId, memberId)}/profile`;
export const membersStatsUrl = (companyId: string) => `${endpoint(companyId)}/stats`;

function normalizeOne(m: any): MemberDto {
  // FE-tolerantní mapování, drží konzistenci s MemberDto tvarem (v2)
  return {
    id: String(m.id ?? m.memberId ?? m.userId ?? m.email),
    email: m.email,
    role: m.role as CompanyRoleName,
    firstName: m.firstName ?? null,
    lastName: m.lastName ?? null,
    phone: m.phone ?? null,
    status: m.status,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  } as MemberDto;
}

function normalizeSummary(m: any): MemberSummaryDto {
  return {
    id: String(m.id ?? m.memberId ?? m.userId ?? m.email),
    email: m.email,
    firstName: m.firstName ?? null,
    lastName: m.lastName ?? null,
    role: m.companyRole ?? m.role ?? null,
    phone: m.phone ?? null,
  } as MemberSummaryDto;
}

function isCanceled(e: unknown): boolean {
  return (
    // axios v1 style
    (e as any)?.code === 'ERR_CANCELED' ||
    // ky/fetch style
    (e as any)?.name === 'AbortError' ||
    // axios <1
    (api as any)?.isCancel?.(e) === true ||
    (e as any)?.name === 'CanceledError' ||
    (e as any)?.message === 'canceled'
  );
}

export type ListOptions = {
  q?: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
  /** Budoucí rozšíření: server-side kurzor. Pokud je nastaven, `page/size` se neposílají. */
  cursor?: string;
  /** Volitelné extra hlavičky (If-None-Match apod.). */
  headers?: Record<string, string>;
};

/** GET /api/v1/tenants/{companyId}/members – summary list */
export async function listMemberSummaries(
  companyId: string,
  opts: ListOptions = {}
): Promise<PageResponse<MemberSummaryDto>> {
  const rawPage = toInt(opts.page, 0);
  const rawSize = toInt(opts.size, 20);
  const page = clamp(rawPage, 0, 1_000_000);
  const size = clamp(rawSize, 1, 100);
  const q = sanitizeQ(opts.q);
  const { signal, cursor, headers } = opts;

  try {
    const params = cursor ? { cursor, q } : { q, page, size };
    const res = await api.get<any>(endpoint(companyId), { params, signal, headers });

    const payload = res.data ?? {};
    const rawItems = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
      ? payload
      : [];

    const items: MemberSummaryDto[] = rawItems.map(normalizeSummary);

    return {
      items,
      page: Number(payload?.page ?? page),
      size: Number(payload?.size ?? size),
      total: Number(payload?.total ?? items.length),
    };
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** GET /api/v1/tenants/{companyId}/members */
export async function listMembers(
  companyId: string,
  opts: ListOptions = {}
): Promise<PageResponse<MemberDto>> {
  const rawPage = toInt(opts.page, 0);
  const rawSize = toInt(opts.size, 20);
  const page = clamp(rawPage, 0, 1_000_000);
  const size = clamp(rawSize, 1, 100);
  const q = sanitizeQ(opts.q);
  const { signal, cursor, headers } = opts;

  try {
    const params = cursor ? { cursor, q } : { q, page, size };
    const res = await api.get<any>(endpoint(companyId), { params, signal, headers });

    const payload = res.data ?? {};
    const rawItems = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
      ? payload
      : [];

    const items: MemberDto[] = rawItems.map(normalizeOne);

    return {
      items,
      page: Number(payload?.page ?? page),
      size: Number(payload?.size ?? size),
      total: Number(payload?.total ?? items.length),
    };
  } catch (e) {
    if (isCanceled(e)) throw e; // ne-mapovat cancel
    mapAndThrow(e);
  }
}

/** GET /api/v1/tenants/{companyId}/members/{memberId}/profile */
export async function getMember(companyId: UUID, memberId: UUID, opts?: { signal?: AbortSignal }) {
  try {
    const { data } = await api.get<MemberDto>(memberProfileUrl(companyId, memberId), {
      signal: opts?.signal,
    });
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** POST /api/v1/tenants/{companyId}/members */
export async function createMember(companyId: string, body: CreateMemberRequest): Promise<MemberDto> {
  try {
    const res = await api.post<any>(endpoint(companyId), body);
    return normalizeOne(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** PATCH /api/v1/tenants/{companyId}/members/{memberId}/profile */
export async function updateMemberProfile(
  companyId: string,
  memberId: string,
  body: UpdateMemberProfileRequest
): Promise<MemberDto> {
  try {
    const sanitized = compact(body);            // ← vyhodí null/undefined
    const res = await api.patch<any>(memberProfileUrl(companyId, memberId), sanitized);
    return normalizeOne(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** @deprecated Nepoužívej pro profil+roli zároveň. Použij `updateMemberProfile` a `updateMemberRole`. */
export async function updateMember(
  companyId: string,
  memberId: string,
  body: UpdateMemberRequest
): Promise<MemberDto> {
  try {
    console.log(body);
    const res = await api.patch<any>(memberProfileUrl(companyId, memberId), body);
    return normalizeOne(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** DELETE /api/v1/tenants/{companyId}/members/{memberId} */
export async function deleteMember(companyId: UUID, memberId: UUID): Promise<void> {
  try {
    await api.delete<void>(memberUrl(companyId, memberId));
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// --- NOT CRUD ---
/** PATCH (role only) /api/v1/tenants/{companyId}/members/{memberId} */
export async function updateMemberRole(
  companyId: string,
  memberId: string,
  body: UpdateMemberRoleRequest
): Promise<MemberDto> {
  try {
    if (body?.role && !(ROLE_WHITELIST as readonly string[]).includes(String(body.role))) {
      throw new Error('Invalid role value on client');
    }
    const res = await api.patch<any>(memberUrl(companyId, memberId), body);
    return normalizeOne(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// GET /api/v1/tenants/{companyId}/members/stats
export async function getMembersStats(
  companyId: string,
  opts?: { signal?: AbortSignal }
): Promise<MembersStatsDto> {
  try {
    const { data } = await api.get<MembersStatsDto>(
      membersStatsUrl(companyId),
      { signal: opts?.signal }
    );
     console.log(data);
    // bezpečný fallback – 0, pokud BE nepošle owners
    const owners = Number((data as any)?.owners ?? 0);
    return { ...data, owners }; // <- žádné TS2783, explicitně přepíšeme/doplníme
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

