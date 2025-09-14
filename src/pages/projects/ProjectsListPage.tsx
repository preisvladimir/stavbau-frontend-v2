import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import { Link } from "react-router-dom";

export default function ProjectsListPage(){
  return (
    <div className="space-y-4">
     <div className="flex items-center justify-between">
       <h2 className="text-lg font-semibold">Projekty</h2>
        <ScopeGuard required="projects:create" fallback={null}>
          <Link to="/app/projects/new" className="rounded px-3 py-2 border">Nový projekt</Link>
       </ScopeGuard>
      </div>
      <div className="text-sm text-muted-foreground">TODO: seznam projektů</div>
    </div>
  );
}