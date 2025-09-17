import { api } from "@/lib/api/client";
import type { AresCompanyDto } from "@/lib/api/types";

//export type AddressDto = { street: string; city: string; zip: string; country: string };


export class RegistrationService {
  static async getFromAres(ico: string, signal?: AbortSignal): Promise<AresCompanyDto> {
    const res = await api.get<AresCompanyDto>("/companies/lookup/ares", {
      params: { ico },
      signal,
    });
    return res.data;
  }
}
