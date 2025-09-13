import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

/** TODO: redirect na /login?redirectTo=... pokud není isAuthenticated */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthContext();
  const loc = useLocation();
  if (!isAuthenticated) return <Navigate to={`/login?redirectTo=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Outlet />;
}
