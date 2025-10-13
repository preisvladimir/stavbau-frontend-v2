import type { AddressDto } from '@/types';

export type ListCustomersParams = {
  q?: string;
  page?: number;
  size?: number;
};

export const ALLOWED_SORT = new Set(['name', 'ico', 'dic', 'createdAt', 'updatedAt', 'id']);
export type CustomerFilters = { status?: string };

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