import { api } from "@/lib/api/client";
import type {
  MemberListResponse,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberDto,
} from "@/lib/api/types";
import { mapAndThrow } from "@/lib/api/problem";
import axios from "axios";

/** Base endpoint pro Company members */
const endpoint = (companyId: string) =>
  `/tenants/${encodeURIComponent(companyId)}/members`;

const memberUrl = (companyId: string, memberId: string) =>
  `${endpoint(companyId)}/${encodeURIComponent(memberId)}`;

export const TeamService = {
   /** GET /api/v1/tenants/{companyId}/members */
   async list(companyId: string, opts?: { signal?: AbortSignal }) {
     try {
      const res = await api.get<any>(endpoint(companyId), { signal: opts?.signal });
       const payload = res.data;
       const items = Array.isArray(payload?.items)
         ? payload.items
         : Array.isArray(payload)
         ? payload
         : [];
       const normalized: MemberDto[] = items.map((m: any) => ({
         id: m.id ?? m.memberId ?? m.userId ?? m.email,
         email: m.email,
         role: m.role,
         firstName: m.firstName ?? null,
         lastName: m.lastName ?? null,
         phone: m.phone ?? null,
       }));
       return { items: normalized, total: payload?.total ?? normalized.length } as MemberListResponse;
     } catch (e) {
      // Ne-mapovat cancel → ať si ho komponenta může ignorovat
      if (
        (axios.isAxiosError?.(e) && e.code === "ERR_CANCELED") ||
        (typeof (axios as any).isCancel === "function" && (axios as any).isCancel(e)) ||
        (e as any)?.message === "canceled" ||
        (e as any)?.name === "CanceledError" ||
        (e as any)?.name === "AbortError"
      ) {
        throw e;
      }
       mapAndThrow(e);
     }
   },

   /** POST /api/v1/tenants/{companyId}/members */
   async add(companyId: string, body: CreateMemberRequest) {
   try {
     const res = await api.post<MemberDto>(endpoint(companyId), body);
     return res.data;
   } catch (e) {
     mapAndThrow(e);
   }
   },

   /** PATCH /api/v1/tenants/{companyId}/members/{memberId} */
   async update(
     companyId: string,
     memberId: string,
     body: UpdateMemberRequest
   ) {
;
    try {
      const res = await api.patch<MemberDto>(memberUrl(companyId, memberId), body);
      return res.data;
    } catch (e) {
      mapAndThrow(e);
    }
   },


   /** DELETE /api/v1/tenants/{companyId}/members/{memberId} */
   async remove(companyId: string, memberId: string) {
    try {
      await api.delete<void>(memberUrl(companyId, memberId));
    } catch (e) {
      mapAndThrow(e);
    }
   },
 } as const;
