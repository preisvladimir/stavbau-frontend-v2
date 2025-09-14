import ScopeGuard from "@/features/auth/guards/ScopeGuard";

export default function ProjectNewPage(){
  return (
    <ScopeGuard required="projects:create" fallback={<div className="text-sm text-muted-foreground">Nemáš oprávnění vytvořit projekt.</div>}>
      <div>TODO: New Project</div>
    </ScopeGuard>
  );
}