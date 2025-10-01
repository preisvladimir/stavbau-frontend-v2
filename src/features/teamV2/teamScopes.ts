// Central place to reference Team scopes without scattering string literals
export const TEAM_SCOPES = {
WRITE: 'team:write',    
READ: 'team:read',
ADD: 'team:add',
UPDATE:'team:update',
REMOVE: 'team:remove',
UPDATE_ROLE: 'team:update_role',
} as const;


export type TeamScope = (typeof TEAM_SCOPES)[keyof typeof TEAM_SCOPES];