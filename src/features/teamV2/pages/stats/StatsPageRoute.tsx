// src/features/teamV2/pages/StatsPageRoute.tsx / revize 13.10.2025
import { useParams, Navigate } from 'react-router-dom';
import StatsPage from './StatsPage';

export default function StatsPageRoute() {
  const { companyId } = useParams<{ companyId: string }>();
  if (!companyId) return <Navigate to="/404" replace />;
  return <StatsPage companyId={companyId} />;
}