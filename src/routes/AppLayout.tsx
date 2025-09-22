import * as React from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { MobileBottomBar, MobileFab, FabProvider} from "@/components/layout";

/** ---- Integrovaný AppLayout (Sidebar + Topbar + Outlet + mobil prvky) ---- */
export default function AppLayout() {
  const { logout } = useAuthContext();

  return (
    <FabProvider>
      <div className="min-h-dvh flex">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Topbar />
          {/* pb-24: rezerva pro mobilní bottom bar, na desktopu ji skrývá md:pb-6 */}
          <div className="p-6 pb-24 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobilní navigace + FAB jako overlay (jen ≤ md) */}
      <MobileBottomBar onLogout={logout} />
      <MobileFab />
    </FabProvider>
  );
}
