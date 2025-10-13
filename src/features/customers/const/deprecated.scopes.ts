// src/features/customers/const/scopes.ts
// Central place to reference Customers scopes without scattering string literals
export const CUSTOMERS_SCOPES = {
    RW: 'customers:rw',
    READ: 'customers:read',
    CREATE: 'customers:create',
    UPDATE: 'customers:update',
    DELETE: 'customers:delete',
    IMPORT : 'customers:import',
    EXPORT : 'customers:export',
    LINK_USER : 'customers:link_user',
} as const;

export type CustomersScope = (typeof CUSTOMERS_SCOPES)[keyof typeof CUSTOMERS_SCOPES];
