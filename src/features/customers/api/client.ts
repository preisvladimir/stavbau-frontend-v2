import { api } from "@/lib/api/client";
import type { PageResponse } from "@/types/PageResponse";
import type { ListCustomersParams, CustomerDto, UpdateCustomerRequest, CustomerSummaryDto, CreateCustomerRequest } from "./types";
//import { mapAndThrow } from "@/lib/api/problem";

export async function listCustomers(params: ListCustomersParams) {
  const res = await api.get<PageResponse<CustomerSummaryDto>>('/customers', { params });
  return res.data;
}

export async function getCustomer(id: string) {
  const res = await api.get<CustomerDto>(`/customers/${id}`);
  return res.data;
}

export async function createCustomer(body: CreateCustomerRequest) {
  const res = await api.post<CustomerDto>('/customers', body);
  return res.data; // 201  body
}

export async function updateCustomer(id: string, body: UpdateCustomerRequest) {
  const res = await api.patch<CustomerDto>(`/customers/${id}`, body);
  return res.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}