// src/features/customers/api/client.ts
import { api } from '@/lib/api/client';
import { mapAndThrow } from '@/lib/api/problem';
import { toPageResponse, type PageResponse } from '@/lib/api/types/PageResponse';
import { pagedLookupFetcher } from '@/lib/api/lookup';
import type {
  UUID,
  CustomerSummaryDto,
  CustomerDto,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from './types';
import { sanitizeQ, isCanceled, langHeader, compact } from '@/lib/api/utils';
import {
  customersListUrl,
  customerUrl,
  customersLookupUrl,
} from './customer-paths';

type IdLike = string | { id?: string } | { value?: string };

function coerceId(id: IdLike): string {
  if (typeof id === 'string') return id;
  const v = (id as any)?.id ?? (id as any)?.value;
  if (typeof v === 'string' && v.trim() !== '') return v;
  throw new Error('Invalid customer id: expected string or {id}/{value} object');
}


// ------------------------------------------------------
// Typy volání listingu
// ------------------------------------------------------
export type ListCustomerParams = {
  q?: string;
  page?: number;
  size?: number;
  sort?: string | string[]; // např. "name,asc" | "ico,desc"
  status?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  cursor?: string; // rezerva do budoucna
};

// ------------------------------------------------------
// Listing — PageResponse<CustomerSummaryDto>
// ------------------------------------------------------
export async function listCustomerSummaries(
  companyId: UUID | string,
  params: ListCustomerParams = {}
): Promise<PageResponse<CustomerSummaryDto>> {
  const { q, page = 0, size = 10, sort = 'name,asc', signal } = params;
  const finalSort = Array.isArray(sort) ? sort : [sort];

  const sp = new URLSearchParams();
  if (q != null) sp.set('q', sanitizeQ(q));
  sp.set('page', String(Math.max(0, page)));
  sp.set('size', String(Math.max(1, size)));
  for (const s of finalSort) sp.append('sort', s);

  try {
    const { data } = await api.get(`${customersListUrl(companyId)}?${sp.toString()}`, {
      signal,
      headers: langHeader(),
    });
    return toPageResponse<CustomerSummaryDto>(data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Paged lookup fetcher pro AsyncSearchSelect
// ------------------------------------------------------
export const pagedCustomerFetcher = (companyId: UUID | string) =>
  pagedLookupFetcher(customersLookupUrl(companyId), 'name,asc');

// ------------------------------------------------------
// Detail
// ------------------------------------------------------
export async function getCustomer(
  companyId: UUID | string,
  id: IdLike,
  opts?: { signal?: AbortSignal }
) {
  try {
    const { data } = await api.get<CustomerDto>(
      customerUrl(companyId, coerceId(id)),
      { signal: opts?.signal, headers: langHeader() }
    );
    return data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Create / Update / Delete
// ------------------------------------------------------
export async function createCustomer(
  companyId: UUID | string,
  body: CreateCustomerRequest
): Promise<void> {
  try {
    const sanitized = compact<CreateCustomerRequest>(body);
    await api.post<void>(customersListUrl(companyId), sanitized, { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function updateCustomer(
  companyId: UUID | string,
  id: string,
  body: UpdateCustomerRequest
) {
  try {
    const sanitized = compact<UpdateCustomerRequest>(body);
    const res = await api.patch<CustomerDto>(customerUrl(companyId, id), sanitized, {
      headers: langHeader(),
    });
    return res.data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function deleteCustomer(
  companyId: UUID | string,
  id: string
): Promise<void> {
  try {
    await api.delete<void>(customerUrl(companyId, id), { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}
