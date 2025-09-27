import { api } from "@/lib/api/client";
import type {
  CustomerSummaryDto,
  PageResponse,
  ListCustomersParams,
  CustomerDto,
} from "@/lib/api/types";
//import { mapAndThrow } from "@/lib/api/problem";

export async function listCustomers(params: ListCustomersParams) {
  const res = await api.get<PageResponse<CustomerSummaryDto>>('/customers', { params });
  return res.data;
}

export async function getCustomer(id: string) {
  const res = await api.get<CustomerDto>(`/customers/${id}`);
  return res.data;
}

