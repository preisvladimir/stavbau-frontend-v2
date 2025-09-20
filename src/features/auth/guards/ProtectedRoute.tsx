// src/features/auth/guards/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
// volitelné: spinner z ikon
import { Loader2 } from "@/components/icons";

export default function ProtectedRoute() {
  const { isAuthenticated, authBooting } = useAuthContext();
  const loc = useLocation();

  // 1) Počkej na bootstrap autentizace (tichý refresh)
  if (authBooting) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--sb-muted))]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Načítání…</span>
        </div>
      </div>
    );
  }

  // 2) Pokud po bootu nejsme přihlášeni → přesměruj na /login s návratem
  if (!isAuthenticated) {
    const redirectTo = encodeURIComponent(`${loc.pathname}${loc.search}`);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  // 3) OK, pusť dál
  return <Outlet />;
}
