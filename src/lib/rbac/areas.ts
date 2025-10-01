export const RBAC_AREAS = {
  CUSTOMERS: {
    WRITE: 'invoices:write',
    READ: 'invoices:read',
    CREATE: 'invoices:create',
    UPDATE: 'invoices:update',
    DELETE: 'invoices:delete',
  },
  TEAM: {
    WRITE: 'team:write',
    READ: 'team:read',
    CREATE: 'team:create',
    UPDATE: 'team:update',
    DELETE: 'team:delete',
  },
} as const;