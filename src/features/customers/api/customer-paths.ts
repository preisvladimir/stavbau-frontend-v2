// src/features/customers/api/customer-paths.ts
import type { UUID } from './types';

export const customersListUrl = (companyId: UUID | string) =>
  `/company/${encodeURIComponent(String(companyId))}/customers`;

export const customerUrl = (companyId: UUID | string, id: UUID | string) =>
  `${customersListUrl(companyId)}/${encodeURIComponent(String(id))}`;

export const customersLookupUrl = (companyId: UUID | string) =>
  `${customersListUrl(companyId)}/lookup`;
