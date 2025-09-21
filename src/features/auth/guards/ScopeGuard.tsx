import { hasScope } from "../utils/hasScope";
import { useAuthContext } from "../context/AuthContext";

type Props = {
  /** ALL-of semantics (původní chování). String nebo pole. */
  required?: string | string[];
  /** ANY-of semantics (nové) – true, pokud má uživatel alespoň jeden scope ze seznamu. */
  anyOf?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function ScopeGuard({ required, anyOf, children, fallback = null }: Props) {
  const { user } = useAuthContext();
  const scopes: string[] = (user as any)?.scopes ?? [];

  let allowed = true;
  const hasRequired = required !== undefined ? hasScope(scopes, required) : undefined;
  const hasAny = Array.isArray(anyOf) && anyOf.length > 0 ? anyOf.some((s) => hasScope(scopes, s)) : undefined;

  if (hasRequired === undefined && hasAny === undefined) {
    allowed = true; // žádná podmínka > propustit
  } else if (hasRequired !== undefined && hasAny !== undefined) {
    allowed = hasRequired || hasAny; // pokud jsou obě podmínky, stačí splnit jednu
  } else if (hasRequired !== undefined) {
    allowed = hasRequired;
  } else if (hasAny !== undefined) {
    allowed = hasAny;
  }

  return <>{allowed ? children : fallback}</>;
}
