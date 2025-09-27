import { api } from "@/lib/api/client";
import type { CompanyLookupPreviewDto, CompanyRegistrationRequest, CompanyRegistrationResponse } from "./types";

export class RegistrationService {
  /** Normalized FE-ready preview from BE */
  static async getFromAres(ico: string, signal?: AbortSignal): Promise<CompanyLookupPreviewDto> {
    const res = await api.get<CompanyLookupPreviewDto>("/companies/lookup/ares/preview", {
      params: { ico },
      signal,
    });
    return res.data;
  }

  static async register(body: CompanyRegistrationRequest, signal?: AbortSignal): Promise<CompanyRegistrationResponse> {
    const res = await api.post<CompanyRegistrationResponse>("/tenants/register", body, { signal });
    return res.data;
  }  
  
}
