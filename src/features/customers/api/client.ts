// src/features/customers/api/client.ts
import { api } from '@/lib/api/client';
import { mapAndThrow } from '@/lib/api/problem';
import { toPageResponse, type PageResponse } from '@/types/PageResponse';
import type {
  CustomerSummaryDto,
  CustomerDto,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from './types';
import { ALLOWED_SORT } from './types';
import {
  clamp,
  toInt,
  sanitizeQ,
  isCanceled,
  langHeader,
  compact,
  normalizeSort,
} from '@/lib/api/utils';
// ------------------------------------------------------
// (helpers přesunuty do @/lib/api/utils)
// ------------------------------------------------------

// ------------------------------------------------------
// Endpointy
// ------------------------------------------------------
const base = '/customers';
const customerUrl = (id: string) => `${base}/${encodeURIComponent(String(id))}`;

// ------------------------------------------------------
// Typy volání listingu
// ------------------------------------------------------
export type ListOptions = {
  q?: string;
  page?: number;
  size?: number;
  sort?: string;        // např. "name,asc" | "ico,desc"
  signal?: AbortSignal;
  headers?: Record<string, string>;
  cursor?: string;      // rezerva do budoucna
};

const normalizeSortLocal = (s?: string) => normalizeSort(s, ALLOWED_SORT);

// ------------------------------------------------------
// Listing — doporučený vstupní bod (PageResponse<CustomerSummaryDto>)
// ------------------------------------------------------
export async function listCustomerSummaries(
  opts: ListOptions = {}
): Promise<PageResponse<CustomerSummaryDto>> {
  const rawPage = toInt(opts.page, 0);
  const rawSize = toInt(opts.size, 20);
  const page = clamp(rawPage, 0, 1_000_000);
  const size = clamp(rawSize, 1, 100);
  const q = sanitizeQ(opts.q);
  const { signal, headers, cursor } = opts;
  const sort = normalizeSortLocal(opts.sort);

  try {
    const params = cursor ? { cursor, q, sort } : { q, page, size, sort };
    const res = await api.get<any>(base, {
      params,
      signal,
      headers: { ...langHeader(), ...headers },
    });
    return toPageResponse<CustomerSummaryDto>(res.data);
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Backward compatibility alias (původní jméno)
// ------------------------------------------------------
export async function listCustomers(params: ListOptions = {}) {
  return listCustomerSummaries(params);
}

type CustomerSummary = { id: string; name?: string | null; ico?: string | null; email?: string | null };

export async function searchCustomers(
  q: string,
  signal?: AbortSignal
): Promise<{ value: string; label: string }[]> {
  const params = new URLSearchParams();
  params.set('page', '0');
  params.set('size', '10');
  params.set('sort', 'name,asc');
  if (q?.trim()) params.set('q', q.trim());

  const res = await api.get(`/customers?${params.toString()}`, {
    signal,
    headers: langHeader(),
  });

  // ✅ sjednocení Spring Page (content) vs. PageResponse (items)
  const page = toPageResponse<CustomerSummary>(res.data);

  return (page.items ?? []).map((c) => {
    const base = c.name?.trim() || c.email?.trim() || String(c.id);
    const label = c.ico?.trim() ? `${base} (${c.ico})` : base;
    return { value: String(c.id), label };
  });
}

// ------------------------------------------------------
// Detail
// ------------------------------------------------------
export async function getCustomer(id: string, opts?: { signal?: AbortSignal }) {
  try {
    const res = await api.get<CustomerDto>(customerUrl(id), {
      signal: opts?.signal,
      headers: langHeader(),
    });
    return res.data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

// ------------------------------------------------------
// Create / Update / Delete
// ------------------------------------------------------
export async function createCustomer(body: CreateCustomerRequest) {
  try {
    const sanitized = compact<CreateCustomerRequest>(body);
    const res = await api.post<CustomerDto>(base, sanitized, {
      headers: langHeader(),
    });
    return res.data; // 201 + body
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function updateCustomer(id: string, body: UpdateCustomerRequest) {
  try {
    const sanitized = compact<UpdateCustomerRequest>(body);
    const res = await api.patch<CustomerDto>(customerUrl(id), sanitized, {
      headers: langHeader(),
    });
    return res.data;
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await api.delete<void>(customerUrl(id), { headers: langHeader() });
  } catch (e) {
    if (isCanceled(e)) throw e;
    mapAndThrow(e);
  }
}
