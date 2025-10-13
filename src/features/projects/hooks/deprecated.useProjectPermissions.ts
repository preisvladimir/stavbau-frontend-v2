// src/features/projects/hooks/useProjectPermissions.ts
import { useMemo } from 'react';
import { useHasScope } from '@/features/auth/hooks/useHasScope';
import { PROJECT_SCOPES } from '@/features/projects/const/deprecated.scopes';

export function useProjectPermissions() {
    const canRead = useHasScope(PROJECT_SCOPES.READ);
    const canCreate = useHasScope(PROJECT_SCOPES.CREATE);
    const canUpdate = useHasScope(PROJECT_SCOPES.UPDATE);
    const canArchive = useHasScope(PROJECT_SCOPES.ARCHIVE);
    const canDelete = useHasScope(PROJECT_SCOPES.DELETE);
    const canAssign = useHasScope(PROJECT_SCOPES.ASSIGN);

    return useMemo(
        () => ({ canRead, canCreate, canUpdate, canArchive, canDelete, canAssign }),
        [canRead, canCreate, canUpdate, canArchive, canDelete, canAssign]
    );
}