export type AddressDto = { street: string; city: string; zip: string; country: string };

// ARES response (zjednodušené podle BE)
export type CompanyLookupPreviewDto = {
  ico: string;
  dic?: string | null;
  name: string;
  legalFormCode?: string | null;
  legalFormName?: string | null;
  address: AddressDto;
};

// Request pro registraci
export type CompanyRegistrationRequest = {
  company: {
    ico: string;
    dic?: string | null;
    name: string;
    address: AddressDto;
    legalFormCode?: string | null;
  };
  owner: {
    email: string;
    password: string;
    firstName?: string | null; // MVP neperzistujeme, ale necháme v DTO
    lastName?: string | null;
    phone?: string | null;
  };
  consents: { termsAccepted: boolean; marketing?: boolean | null };
};

export type CompanyRegistrationResponse = {
  companyId: string;
  ownerUserId: string;
  ownerRole: 'OWNER';
  status: 'CREATED' | 'EXISTS' | 'PENDING_VERIFICATION';
};

export type CompanyState = {
  ico: string;
  dic?: string | null;
  name: string;
  address: AddressDto;
  legalFormCode?: string | null;
  legalFormName?: string | null;
};

export type OwnerState = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export type ConsentsState = { termsAccepted: boolean; marketing?: boolean | null };

export type RegistrationState = {
  step: 0 | 1 | 2 | 3;
  maxReachedStep: 0 | 1 | 2 | 3;
  company: CompanyState;
  owner: OwnerState;
  consents: ConsentsState;
  result?: {
    companyId: string;
    ownerUserId: string;
    ownerRole: "OWNER";
    status: "CREATED" | "EXISTS" | "PENDING_VERIFICATION";
  };
};