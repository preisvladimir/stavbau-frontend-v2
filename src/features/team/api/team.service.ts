import { api } from "@/lib/api/client";
import type {
  MemberListResponse,
  CreateMemberRequest,
  UpdateMemberRequest,
  UpdateMemberRoleRequest,
  MemberDto,
} from "@/lib/api/types";
import { mapAndThrow } from "@/lib/api/problem";
import axios from "axios";

/**
 * Base endpoint pro Company members.
 * Pozn.: počítá se s tím, že Axios `api` má baseURL např. `/api/v1`.
 * => výsledné volání: /api/v1/tenants/{companyId}/members
 */
const endpoint = (companyId: string) =>
  `/tenants/${encodeURIComponent(companyId)}/members`;

const memberUrl = (companyId: string, memberId: string) =>
  `${endpoint(companyId)}/${encodeURIComponent(memberId)}`;

function normalizeOne(m: any): MemberDto {
  return {
    id: m.id ?? m.memberId ?? m.userId ?? m.email,
    email: m.email,
    role: m.role,
    firstName: m.firstName ?? null,
    lastName: m.lastName ?? null,
    phone: m.phone ?? null,
    status: m.status ?? null,
  };
}

function isCanceled(e: unknown): boolean {
  return (
    (axios.isAxiosError?.(e) && e.code === "ERR_CANCELED") ||
    (typeof (axios as any).isCancel === "function" && (axios as any).isCancel(e)) ||
    (e as any)?.message === "canceled" ||
    (e as any)?.name === "CanceledError" ||
    (e as any)?.name === "AbortError"
  );
}

export const TeamService = {
  /** GET /api/v1/tenants/{companyId}/members */
  async list(companyId: string, opts?: { signal?: AbortSignal }): Promise<MemberListResponse> {
    try {
      const res = await api.get<any>(endpoint(companyId), { signal: opts?.signal });
      const payload = res.data;
      const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];
      const normalized: MemberDto[] = items.map(normalizeOne);
      return { items: normalized, total: payload?.total ?? normalized.length };
    } catch (e) {
      // Ne-mapovat cancel → ať si ho komponenta může ignorovat
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  },

  /** POST /api/v1/tenants/{companyId}/members */
  async add(companyId: string, body: CreateMemberRequest): Promise<MemberDto> {
    try {
      const res = await api.post<any>(endpoint(companyId), body);
      return normalizeOne(res.data);
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  },

  /** PATCH /api/v1/tenants/{companyId}/members/{memberId} */
  async update(
    companyId: string,
    memberId: string,
    body: UpdateMemberRequest
  ): Promise<MemberDto> {
    try {
      const res = await api.patch<any>(memberUrl(companyId, memberId), body);
      return normalizeOne(res.data);
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  },

  /** PATCH (role only) /api/v1/tenants/{companyId}/members/{memberId} */
  async updateMemberRole(
    companyId: string,
    memberId: string,
    body: UpdateMemberRoleRequest
  ): Promise<MemberDto> {
    try {
      const res = await api.patch<any>(memberUrl(companyId, memberId), body);
      return normalizeOne(res.data);
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  },

  /** DELETE /api/v1/tenants/{companyId}/members/{memberId} */
  async remove(companyId: string, memberId: string): Promise<void> {
    try {
      await api.delete<void>(memberUrl(companyId, memberId));
    } catch (e) {
      if (isCanceled(e)) throw e;
      mapAndThrow(e);
    }
  },
} as const;
