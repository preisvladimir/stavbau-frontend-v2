// src/features/auth/hooks/useCompanyId.ts
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/features/auth/context/AuthContext";

export function useRequiredCompanyId(): string {
  const { companyId, authBooting } = useAuthContext();
  const navigate = useNavigate();

  // počkej na bootstrap, ať zbytečně neházíš chybu
  if (authBooting) {
    // volitelně můžeš zde vracet placeholder a v komponentě zobrazit skeleton
    // ale pro "garantovaný string" radši jen dočasně vrať prázdný a nevolej API
    return "" as unknown as string;
  }

  if (!companyId) {
    // bezpečné chování: přesměruj na login (nebo vyhoď chybu)
    navigate("/login", { replace: true });
    throw new Error("Missing companyId");
  }
  return companyId;
}