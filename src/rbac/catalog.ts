// src/features/auth/rbac/catalog.ts
// Jediný zdroj pravdy pro FE RBAC (drž v sync s BE).

export const AREAS = ['team','projects','files','budget','invoices','dashboard','admin','auth','integrations'] as const;
export const ACTIONS = ['read','add','remove','update','create','delete','archive','assign','upload','download','share','export','approve','view','write','manage','me'] as const;

export type Area = typeof AREAS[number];
export type Action = typeof ACTIONS[number];
export type Scope = `${Area}:${Action}`;

// typově bezpečný builder
export const s = (area: Area, action: Action): Scope => `${area}:${action}`;

// ---------- Jemné scopy (konzistence s BE) ----------
export const sc = {
  team: {
    read:   s('team','read'),
    add:    s('team','add'),
    remove: s('team','remove'),
    update: s('team','update'),
    write:  s('team','write'),   // META (viz níže expanze)
  },
  projects: {
    read:    s('projects','read'),
    create:  s('projects','create'),
    update:  s('projects','update'),
    delete:  s('projects','delete'),
    archive: s('projects','archive'),
    assign:  s('projects','assign'),
  },
  // ... další domény
} as const;

// ---------- Helpery jako na BE (hoistované deklarace) ----------
export function of<T>(...items: T[]): ReadonlySet<T> {
  return new Set(items);
}
export function union<T>(...sets: ReadonlyArray<ReadonlySet<T>>): ReadonlySet<T> {
  const out = new Set<T>();
  sets.forEach(s => s.forEach(v => out.add(v)));
  return out;
}
// Volitelné – použij, pokud skládáš role „A MINUS B“
export function minus<T>(base: ReadonlySet<T>, remove: ReadonlySet<T>): ReadonlySet<T> {
  const out = new Set<T>(base);
  remove.forEach(v => out.delete(v));
  return out;
}

// (volitelný příklad použití minus – může zůstat exportnutý, ať není "unused")
const TEAM_ADMIN_BASE = of<Scope>(sc.team.write, sc.team.read, sc.team.add, sc.team.update, sc.team.remove);
export const TEAM_NO_REMOVE = minus(TEAM_ADMIN_BASE, of(sc.team.remove)); // použití minus → žádný warning

// ---------- META expanze (meta-scope -> jemné scopy) ----------
/** Mapa: meta-scope => jemné scopy (pouze podmnožina všech Scope) */
export const META_EXPANSION = {
  [sc.team.write]: of(sc.team.read, sc.team.add, sc.team.remove, sc.team.update),
} as const satisfies Partial<Record<Scope, ReadonlySet<Scope>>>;

// ---------- Role bundly (per area) ----------
// RoleRef je klíč „area.roleName“ – hodí se pro ergonomii a i18n
export type RoleRef = `${Area}.${string}`;

export const roles = {
  team: {
    administrator: of<Scope>(sc.team.write, sc.team.read, sc.team.add, sc.team.update),
    owner: union(
      of<Scope>(sc.team.remove),
      of<Scope>(sc.team.write, sc.team.read, sc.team.add, sc.team.update)
    ),
  },
  // projects: { manager: ..., viewer: ... } atd. – snadno rozšíříš
} as const;

// ---------- Centrum názvosloví pro role (pro autocomplete + validaci) ----------
export const ROLE_KEYS = {
  team: {
    administrator: 'team.administrator' as const,
    owner: 'team.owner' as const,
  },
  // projects: { manager: 'projects.manager' as const, ... }
};
