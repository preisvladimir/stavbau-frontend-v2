import { type AddressDto } from '@/types/common/address';
export type { PageResponse } from "@/lib/api/types";

export type ListCustomersParams = {
  q?: string;
  page?: number;
  size?: number;
};

export interface CustomerDto {
    id: string;
    type: 'ORGANIZATION' | 'PERSON';
    name: string;
    ico?: string | null;
    dic?: string | null;
    email?: string | null;
    phone?: string | null;
    billingAddress?: AddressDto;
    defaultPaymentTermsDays?: number | null;
    notes?: string | null;
    updatedAt?: string | null; // ISO
}

export interface CreateCustomerRequest {
    type: 'ORGANIZATION' | 'PERSON';
    name: string;
    ico?: string | null;
    dic?: string | null;
    email?: string | null;
    phone?: string | null;
    billingAddress?: AddressDto;
    defaultPaymentTermsDays?: number | null;
    notes?: string | null;
    updatedAt?: string | null; // ISO
}

export type CustomerSummaryDto = {
  id: string;
  name: string;
  ico?: string | null;
  dic?: string | null;
  email?: string | null;
  billingAddress?: AddressDto;
  updatedAt: string; // ISO
};

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;