// src/features/projects/const/scopes.ts
// Central place to reference Projects scopes without scattering string literals
export const PROJECT_SCOPES = {
  RW: 'projects:rw',
  READ: 'projects:read',
  CREATE: 'projects:create',
  UPDATE: 'projects:update',
  DELETE: 'projects:delete',
  ARCHIVE: 'projects:archive',
  ASSIGN: 'projects:assign',
} as const;

export type ProjectScope = (typeof PROJECT_SCOPES)[keyof typeof PROJECT_SCOPES];
