// src/lib/api/geo.ts
import { api } from "./client";

export interface AddressSuggestion {
  formatted: string;
  name: string;
  label: string;
  lat: number | null;
  lon: number | null;
  bbox?: { minLat: number; minLon: number; maxLat: number; maxLon: number } | null;
  regionalStructure?: { type: string; name: string; code?: string | null }[];
  street?: string | null;
  houseNumber?: string | null;
  municipality?: string | null;
  municipalityPart?: string | null;
  region?: string | null;
  country?: string | null;
  countryIsoCode?: string | null;
  zip?: string | null;
}

export async function geoSuggest(q: string, limit = 7, lang = "cs") {
  if (!q || q.trim().length < 2) return [] as AddressSuggestion[];
  const { data } = await api.get<AddressSuggestion[]>("/geo/suggest", {
    params: { q, limit, lang },
  });
  return data;
}
