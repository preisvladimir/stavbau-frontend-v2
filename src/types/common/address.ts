// AddressDto – všechna pole dobrovolná (MVP tolerantní)
export interface AddressDto {
  countryCode?: string;
  countryName?: string;
  regionCode?: string;
  regionName?: string;
  districtCode?: string;
  districtName?: string;
  municipalityCode?: string;
  municipalityName?: string;
  city?: string;
  cityPart?: string;
  street?: string;
  houseNumber?: string;
  orientationNumber?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  formatted?: string;
  source?: 'USER' | 'ARES' | 'GEO' | 'IMPORT';
}
