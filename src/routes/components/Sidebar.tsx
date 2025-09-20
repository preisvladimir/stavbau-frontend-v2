import { NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { hasScope } from "@/features/auth/utils/hasScope";

export default function Sidebar() {
 const { user } = useAuth();
  const scopes = user?.scopes ?? [];

  const canReadProjects = hasScope(scopes, "projects:read", "anyOf");
  const canReadTeam = hasScope(scopes, "team:read", "anyOf");

  return (
    <aside className="w-64 border-r p-4 hidden md:block">
      <nav className="space-y-2">
        <NavLink to="/app/dashboard" className="block px-2 py-1 rounded hover:bg-muted">Přehled</NavLink>
        {canReadProjects && (
          <NavLink to="/app/projects" className="block px-2 py-1 rounded hover:bg-muted">Projekty</NavLink>
        )}
        {canReadTeam && (
          <NavLink to="/app/team" className="block px-2 py-1 rounded hover:bg-muted">Team</NavLink>
        )}        
      </nav>
    </aside>
 );
}