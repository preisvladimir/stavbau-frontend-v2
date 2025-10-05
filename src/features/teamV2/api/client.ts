// src/features/team/api/client.ts
import { api } from '@/lib/api/client';
import i18n from '@/i18n';
import { mapAndThrow } from '@/lib/api/problem';
import { toPageResponse, type PageResponse } from '@/types/PageResponse';

import type {
  MembersStatsDto,
  MemberSummaryDto,
  MemberDto,
  CreateMemberRequest,
  UpdateMemberRequest,          // ponecháno kvůli deprecated updateMember
  UpdateMemberRoleRequest,
  UpdateMemberProfileRequest,
  UUID,
} from './types';
import { type CompanyRoleName, ROLE_WHITELIST } from '@/types/common/rbac';

// ------------------------------------------------------
// Helpers (DX, bezpečnost)
// ------------------------------------------------------
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const toInt = (v: unknown, fallback = 0) =>
  Number.isFinite(Number(v)) ? (Number(v) | 0) : fallback;

//const sanitizeStr = (v?: string) => (v ?? '').trim().slice(0, 200);
const isCanceled = (e: unknown): boolean =>
  (e as any)?.code === 'ERR_CANCELED' ||
  (e as any)?.name === 'AbortError' ||
  (api as any)?.isCancel?.(e) === true ||
  (e as any)?.name === 'CanceledError' ||
  (e as any)?.message === 'canceled';

// Shallow compact: zahodí null/undefined, zachová keyof T
function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  const out = {} as Partial<T>;
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (v !== null && v !== undefined) (out as any)[k] = v;
  });
  return out;
}

// helpers
function compactNonEmpty<T extends Record<string, any>>(obj: T): Partial<T> {
  const out = {} as Partial<T>;
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '')) {
      (out as any)[k] = v;
    }
  });
  return out;
}

// NOVÝ: vrací undefined, pokud je to prázdné → param se vůbec nepošle
const toNonEmpty = (v?: string) => {
  const s = (v ?? '').trim();
  return s ? s.slice(0, 200) : undefined;
};

function langHeader() {
  return { 'Accept-Language': i18n.language };
}

// FE whitelist sort klíčů v sync s BE (pokud BE rozšíří, stačí přidat sem)
const ALLOWED_SORT = new Set([
  'id',
  'email',
  'firstName',
  'lastName',
  'phone',
  'role',
  'createdAt',
  'updatedAt',
]);
const normalizeSort = (s?: string) => {
  if (!s) return undefined;
  const [key, dir = 'asc'] = s.split(',', 2);
  const k = key?.trim();
  if (!k || !ALLOWED_SORT.has(k)) return undefined; // necháme default BE
  return `${k},${dir}`;
};

// ------------------------------------------------------
// Endpointy
// ------------------------------------------------------
export const endpoint = (companyId: string) =>
  `/tenants/${encodeURIComponent(companyId)}/members`;
export const memberUrl = (companyId: string, memberId: string) =>
  `${endpoint(companyId)}/${encodeURIComponent(memberId)}`;
export const memberProfileUrl = (companyId: string, memberId: string) =>
  `${memberUrl(companyId, memberId)}/profile`;
export const membersStatsUrl = (companyId: string) =>
  `${endpoint(companyId)}/stats`;

// ------------------------------------------------------
// Volby listingu (vč. rozšiřitelných filtrů)
// ------------------------------------------------------
export type ListOptions = {
  q?: string;
  role?: CompanyRoleName | string;
  email?: string;
  name?: string;    // firstName/lastName na FE si můžete skládat do "name"
  phone?: string;
  status?: string;

  page?: number;
  size?: number;
  sort?: string;        // např. "firstName,asc"
  cursor?: string;      // rezerva do budoucna (BE může ignorovat)

  signal?: AbortSignal;
  headers?: Record<string, string>;
};

// ------------------------------------------------------
// Normalizační utility (volitelně používejte v UI)
// ------------------------------------------------------
export function normalizeMember(m: any): MemberDto {
  const role = (m?.companyRole ?? m?.role) as CompanyRoleName;
  return {
    id: String(m?.id ?? m?.memberId ?? m?.userId ?? m?.email),
    email: m?.email,
    role,
    companyRole: m?.companyRole ?? null,
    firstName: m?.firstName ?? null,
    lastName: m?.lastName ?? null,
    phone: m?.phone ?? null,
    status: m?.status,
    createdAt: m?.createdAt,
    updatedAt: m?.updatedAt,
  } as MemberDto;
}

export function normalizeMemberSummary(m: any): MemberSummaryDto {
  return {
    id: String(m?.id ?? m?.memberId ?? m?.userId ?? m?.email),
    email: m?.email,
    firstName: m?.firstName ?? null,
    lastName: m?.lastName ?? null,
    role: (m?.role ?? m?.companyRole ?? null) as CompanyRoleName | null,
    companyRole: (m?.companyRole ?? m?.role ?? null) as CompanyRoleName | null,
    phone: m?.phone ?? null,
  } as MemberSummaryDto;
}

// ------------------------------------------------------
// Listing – sjednocený přes toPageResponse
// ------------------------------------------------------
export async function listMemberSummaries(
  companyId: string,
  opts: ListOptions = {}
): Promise<PageResponse<MemberSummaryDto>> {
  const page = clamp(toInt(opts.page, 0), 0, 1_000_000);
  const size = clamp(toInt(opts.size, 20), 1, 100);
  const sort = normalizeSort(opts.sort);

  const paramsRaw = opts.cursor
    ? {
      cursor: opts.cursor,
      q: toNonEmpty(opts.q),
      role: toNonEmpty(opts.role as string),
      email: toNonEmpty(opts.email),
      name: toNonEmpty(opts.name),
      phone: toNonEmpty(opts.phone),
      status: toNonEmpty(opts.status),
      sort,
    }
    : {
      q: toNonEmpty(opts.q),
      role: toNonEmpty(opts.role as string),
      email: toNonEmpty(opts.email),
      name: toNonEmpty(opts.name),
      phone: toNonEmpty(opts.phone),
      status: toNonEmpty(opts.status),
      page,
      size,
      sort,
    };

  const params = compactNonEmpty(paramsRaw);
console.log(params);
  try {
    const res = await api.get<any>(endpoint(companyId), {
      params,
      signal: opts.signal,
      headers: { ...langHeader(), ...(opts.headers ?? {}) },
    });
    // Centrální adaptér sjednotí Spring Page → PageResponse
    return toPageResponse<MemberSummaryDto>(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function listMembers(
  companyId: string,
  opts: ListOptions = {}
): Promise<PageResponse<MemberDto>> {
  const page = clamp(toInt(opts.page, 0), 0, 1_000_000);
  const size = clamp(toInt(opts.size, 20), 1, 100);
const sort = normalizeSort(opts.sort);

const paramsRaw = opts.cursor
  ? {
      cursor: opts.cursor,
      q: toNonEmpty(opts.q),
      role: toNonEmpty(opts.role as string),
      email: toNonEmpty(opts.email),
      name: toNonEmpty(opts.name),
      phone: toNonEmpty(opts.phone),
      status: toNonEmpty(opts.status),
      sort,
    }
  : {
      q: toNonEmpty(opts.q),
      role: toNonEmpty(opts.role as string),
      email: toNonEmpty(opts.email),
      name: toNonEmpty(opts.name),
      phone: toNonEmpty(opts.phone),
      status: toNonEmpty(opts.status),
      page,
      size,
      sort,
    };

const params = compactNonEmpty(paramsRaw);

  try {
    const res = await api.get<any>(endpoint(companyId), {
      params,
      signal: opts.signal,
      headers: { ...langHeader(), ...(opts.headers ?? {}) },
    });
    return toPageResponse<MemberDto>(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Detail
// ------------------------------------------------------
export async function getMember(companyId: UUID, memberId: UUID, opts?: { signal?: AbortSignal }) {
  try {
    const { data } = await api.get<MemberDto>(memberProfileUrl(companyId, memberId), {
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
export async function createMember(companyId: string, body: CreateMemberRequest) {
  try {
    const res = await api.post<any>(endpoint(companyId), body, { headers: langHeader() });
    return normalizeMember(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function updateMemberProfile(
  companyId: string,
  memberId: string,
  body: UpdateMemberProfileRequest
): Promise<MemberDto> {
  try {
    const sanitized = compact<UpdateMemberProfileRequest>(body);
    const res = await api.patch<any>(memberProfileUrl(companyId, memberId), sanitized, {
      headers: langHeader(),
    });
    return normalizeMember(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

/** @deprecated Použij `updateMemberProfile` a `updateMemberRole`. */
export async function updateMember(
  companyId: string,
  memberId: string,
  body: UpdateMemberRequest
): Promise<MemberDto> {
  try {
    const res = await api.patch<any>(memberProfileUrl(companyId, memberId), body, {
      headers: langHeader(),
    });
    return normalizeMember(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Role only / Delete / Stats
// ------------------------------------------------------
export async function updateMemberRole(
  companyId: string,
  memberId: string,
  body: UpdateMemberRoleRequest
): Promise<MemberDto> {
  try {
    if (body?.role && !(ROLE_WHITELIST as readonly string[]).includes(String(body.role))) {
      throw new Error('Invalid role value on client');
    }
    const res = await api.patch<any>(memberUrl(companyId, memberId), body, { headers: langHeader() });
    return normalizeMember(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function deleteMember(companyId: UUID, memberId: UUID): Promise<void> {
  try {
    await api.delete<void>(memberUrl(companyId, memberId), { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function getMembersStats(
  companyId: string,
  opts?: { signal?: AbortSignal }
): Promise<MembersStatsDto> {
  try {
    const { data } = await api.get<MembersStatsDto>(membersStatsUrl(companyId), {
      signal: opts?.signal,
      headers: langHeader(),
    });
    const owners = Number((data as any)?.owners ?? 0);
    return { ...data, owners };
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}
