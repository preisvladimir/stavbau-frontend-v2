// src/features/customers/api/client.ts
import { api } from '@/lib/api/client';
import i18n from '@/i18n';
import { mapAndThrow } from '@/lib/api/problem';
import { toPageResponse, type PageResponse } from '@/types/PageResponse';
import type {
  CustomerSummaryDto,
  CustomerDto,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from './types';

// ------------------------------------------------------
// Helpers (DX, bezpečnost)
// ------------------------------------------------------
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const toInt = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) ? (Number(v) | 0) : fallback);
const sanitizeQ = (q?: string) => (q ?? '').trim().slice(0, 200);
const isCanceled = (e: unknown): boolean =>
  (e as any)?.code === 'ERR_CANCELED' ||
  (e as any)?.name === 'AbortError' ||
  (api as any)?.isCancel?.(e) === true ||
  (e as any)?.name === 'CanceledError' ||
  (e as any)?.message === 'canceled';

// Shallow compact: zahodí null/undefined, zachová keyof T
function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  const out = {} as Partial<T>;
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (v !== null && v !== undefined) (out as any)[k] = v;
  });
  return out;
}

function langHeader() {
  return { 'Accept-Language': i18n.language };
}

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

// FE whitelist sort klíčů v sync s BE
const ALLOWED_SORT = new Set(['name', 'ico', 'dic', 'createdAt', 'updatedAt', 'id']);
const normalizeSort = (s?: string) => {
  if (!s) return undefined;
  const [key, dir = 'asc'] = s.split(',', 2);
  const k = key?.trim();
  if (!k || !ALLOWED_SORT.has(k)) return undefined; // ponech default BE
  return `${k},${dir}`;
};

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
  const sort = normalizeSort(opts.sort);

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
