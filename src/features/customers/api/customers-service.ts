// src/features/customers/api/customers-service.ts
import type {
  UUID,
  CustomerSummaryDto,
  CustomerDto,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from './types';
import { createRestService } from '@/lib/api/restService';
import {
  customersListUrl as base,     // (companyId) => /company/{id}/customers
  customerUrl as item,           // (companyId, id) => /.../{id}
  customersLookupUrl as lookup,  // (companyId) => /.../lookup
} from './customer-paths';

/** UI/BE filtry pro Customers (rozšiř podle potřeby) */
export type CustomerFilters = { status?: string };

/** ------------------------------------------------------
 *  1) „Core“ service z generiky (NE-curried)
 *     – metody berou vždy `companyId` jako 1. parametr
 * ------------------------------------------------------ */
const core = createRestService<
  UUID,
  CustomerFilters,
  CustomerSummaryDto,
  CustomerDto,
  CreateCustomerRequest,
  UpdateCustomerRequest
>({
  paths: {
    base,
    item,
    lookup,
    remove: item,       // DELETE /{id}
    // archive / unarchive zatím doména customers nepoužívá
  },
  defaultSort: 'name,asc',
  filtersToQuery: (f) => ({
    status: f.status?.trim() || undefined,
  }),
});

/** ------------------------------------------------------
 *  2) Wrapper navázaný na konkrétní companyId
 *     – stejné API jako dřív, jen bez nutnosti předávat companyId pokaždé
 * ------------------------------------------------------ */
export const customersService = (companyId: UUID | string) => {
  const cid = String(companyId);

  return {
    // list / lookup
    list: (params?: Parameters<typeof core.list>[1]) => core.list(cid, params),
    lookup: (params?: Parameters<typeof core.lookup>[1]) => core.lookup(cid, params),

    // CRUD
    get: (id: UUID, opts?: Parameters<typeof core.get>[2]) => core.get(cid, id, opts),
    create: (body: CreateCustomerRequest) => core.create(cid, body),
    update: (id: UUID, body: UpdateCustomerRequest) => core.update(cid, id, body),
    remove: (id: UUID) => core.remove(cid, id),

    // AsyncSearchSelect helper (paged)
    pagedLookupFetcher: (sort: string | string[] = 'name,asc') =>
      core.pagedLookupFetcher(cid, sort),
  };
};

/** Rychlý helper pro <AsyncSearchSelect /> – přímo fetcher funkce */
export const pagedCustomerFetcher = (companyId: UUID | string) =>
  core.pagedLookupFetcher(String(companyId), 'name,asc');
