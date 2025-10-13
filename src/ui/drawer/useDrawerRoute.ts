// src/components/ui/stavbau-ui/drawer/useDrawerRoute.ts
import { useParams } from "react-router-dom";

/**
 * Konvence: :id = entity id | "new"
 */
export function useDrawerRoute(paramKey: string = "id") {
  const params = useParams();
  const raw = params[paramKey];
  const isCreate = raw === "new";
  const isEdit = !!raw && raw !== "new";
  const entityId = isEdit ? String(raw) : undefined;
  return { isCreate, isEdit, entityId, rawParam: raw };
}
