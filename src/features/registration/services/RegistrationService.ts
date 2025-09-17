import { api } from "@/lib/api/client";
import type { CompanyLookupPreviewDto } from "@/lib/api/types";

export class RegistrationService {
  /** Normalized FE-ready preview from BE */
  static async getFromAres(ico: string, signal?: AbortSignal): Promise<CompanyLookupPreviewDto> {
    const res = await api.get<CompanyLookupPreviewDto>("/companies/lookup/ares/preview", {
      params: { ico },
      signal,
    });
    return res.data;
  }
}
