// src/features/teamV2/pages/StatsPageAuto.tsx
import { useParams, Navigate } from 'react-router-dom';
import StatsPage from './StatsPage';
import { useRequiredCompanyId } from '@/features/auth/hooks/useCompanyId';

export default function StatsPageAuto() {
  const { companyId: cidFromRoute } = useParams<{ companyId?: string }>();
  const cidFromCtx = useRequiredCompanyId();
  const companyId = cidFromRoute ?? cidFromCtx ?? null;
  if (!companyId) return <Navigate to="/select-company" replace />;
  return <StatsPage companyId={companyId} />;
}