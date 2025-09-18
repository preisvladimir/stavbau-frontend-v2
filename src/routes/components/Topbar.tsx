import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogOut } from "@/components/icons";
import { Button } from "@/components/ui/stavbau-ui"; // nebo náš Button

export default function Topbar() {
  const { logout, user } = useAuth();
  return (
    <div className="flex items-center justify-end gap-2 p-2">
      <div className="text-sm text-[rgb(var(--sb-muted))] mr-2">
        {user?.fullName ?? user?.email}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => logout({ server: true })} // pokud BE /auth/logout existuje; jinak { server: false }
        aria-label="Odhlásit se"
        leftIcon={<LogOut className="h-4 w-4" aria-hidden />}
      >
        Odhlásit
      </Button>
    </div>
  );
}