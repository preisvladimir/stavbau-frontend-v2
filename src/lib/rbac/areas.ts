export const RBAC_AREAS = {
 CUSTOMERS: {
    WRITE:  'invoices:write', 
    READ:   'invoices:read',     // TODO: snadný switch na 'customers:read'
    CREATE: 'invoices:create',
    UPDATE: 'invoices:update',
    DELETE: 'invoices:delete',
  },
} as const;