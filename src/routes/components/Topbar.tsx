// src/app/components/Topbar.tsx
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogOut } from "@/components/icons";
import { Button } from "@/components/ui/stavbau-ui";
// pokud máš barrel export, nech `@/components/layout`; jinak použij explicitní cestu níže:
//import { TopbarActions } from "@/components/layout";

export default function Topbar() {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-[rgb(var(--sb-border))] bg-white">
      <div className="h-14 px-4 md:px-6 flex items-center gap-3">
        {/* Levá část (můžeš doplnit breadcrumb / název stránky / vyhledávání) */}
        <div className="flex-1 min-w-0" />

        {/* Pravá část: stránkové akce (desktop) napojené na FabContext <TopbarActions /> */}
        

        {/* Profil + odhlášení */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-[rgb(var(--sb-muted))]">
            {user?.fullName ?? user?.email ?? "—"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout({ server: true })} // pokud nemáš BE logout, použij { server: false }
            ariaLabel="Odhlásit se"
            leftIcon={<LogOut className="h-4 w-4" aria-hidden="true" />}
          >
            Odhlásit
          </Button>
        </div>
      </div>
    </header>
  );
}
