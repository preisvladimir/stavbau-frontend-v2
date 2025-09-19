import { api } from "@/lib/api/client";
import type {
  MemberListResponse,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberDto,
} from "@/lib/api/types";
import { mapAndThrow } from "@/lib/api/problem";

/** Base endpoint pro Company members */
const endpoint = (companyId: string) =>
  `/tenants/${encodeURIComponent(companyId)}/members`;

const memberUrl = (companyId: string, memberId: string) =>
  `${endpoint(companyId)}/${encodeURIComponent(memberId)}`;

export const TeamService = {
   /** GET /api/v1/tenants/{companyId}/members */
   async list(companyId: string, opts?: { signal?: AbortSignal }) {
    try {
      const res = await api.get<MemberListResponse>(endpoint(companyId), {
        signal: opts?.signal,
      });
      return res.data;
    } catch (e) {
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
