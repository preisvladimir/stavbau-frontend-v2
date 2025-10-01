// src/features/team/components/TeamMemberDetailDrawer.tsx
import * as React from "react";
import { DetailDrawer } from "@/components/ui/stavbau-ui/drawer/detail-drawer";
import { Button } from "@/components/ui/stavbau-ui/button";
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import { RBAC_AREAS } from "@/lib/rbac/areas";
import type { MemberDto } from "../api/types";

type Props = {
  open: boolean;
  member: MemberDto;
  onClose: () => void;
  onEdit?: (m: MemberDto) => void;
  onDelete?: (m: MemberDto) => void;
};

export const TeamMemberDetailDrawer: React.FC<Props> = ({
  open,
  member,
  onClose,
  onEdit,
  onDelete,
}) => {
  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Detail člena týmu"
      headerRight={
        <>
          <ScopeGuard anyOf={[RBAC_AREAS.TEAM?.WRITE ?? RBAC_AREAS.CUSTOMERS.WRITE]}>
            <Button variant="outline" size="sm" onClick={() => onEdit?.(member)}>
              Upravit
            </Button>
          </ScopeGuard>
          <ScopeGuard anyOf={[RBAC_AREAS.TEAM?.DELETE ?? RBAC_AREAS.CUSTOMERS.DELETE]}>
            <Button variant="danger" size="sm" onClick={() => onDelete?.(member)}>
              Smazat
            </Button>
          </ScopeGuard>
        </>
      }
    >
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-medium">
            {[member.firstName, member.lastName].filter(Boolean).join(" ") || "—"}
          </h3>
          <p className="text-sm text-[rgb(var(--sb-muted))]">{member.email ?? "—"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium">Role:</span> {member.role ?? "—"}
          </div>
          <div>
            <span className="font-medium">Telefon:</span> {member.phone ?? "—"}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Vytvořen:</span> {member.createdAt ?? "—"}
          </div>
        </div>
      </section>
    </DetailDrawer>
  );
};
