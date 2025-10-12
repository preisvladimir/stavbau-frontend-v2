# 🧩 RBAC – Jednotná řízení oprávnění (Frontend)

Tento modul představuje **jediný zdroj pravdy** pro všechny oprávnění (**RBAC**) ve frontendové aplikaci STAVBAU-V2.  
Drží konzistenci s backendem (`cz.stavbau.backend.security.rbac` – RBAC 2.1) a umožňuje jednoduše řídit, kdo co vidí, může nebo nemůže udělat.

---

## 🎯 Cíl

- Jeden centralizovaný katalog scopes ve tvaru **`area:action`** (např. `projects:read`, `team:add`).
- Podpora **meta-scopů** (např. `team:write` → `read/add/remove/update`).
- Podpora **rolí/bundlů** (např. `team.administrator`, `team.owner`).
- Konzistentní použití na FE i BE.
- Typová bezpečnost, autocompletion a jednoduché API v Reactu.

---

## 📁 Struktura

```
src/rbac/
├─ catalog.ts        # definice scopes, meta-expanze, role bundly, helpery
├─ expand.ts         # logika rozbalení meta/rolí na jemné scopy
├─ hooks.ts          # useHasAny / useHasAll – jednoduché hooky pro kontrolu oprávnění
├─ ScopeGuard.tsx    # React guard komponenta <ScopeGuard anyOf/allOf>
└─ index.ts          # centrální export pro pohodlný import:  import { sc, ScopeGuard } from '@/rbac';
```

---

## 🚀 Importy

Díky `index.ts` používáme zkrácené importy:

```ts
import { sc, ROLE_KEYS, ScopeGuard, useHasAny, useHasAll } from '@/rbac';
```

---

## 🧱 Základní pojmy

| Typ / konstanta | Význam | Příklad |
|-----------------|--------|----------|
| **`Scope`** | Konkrétní oprávnění ve formátu `area:action`. | `"projects:create"` |
| **`sc`** | Strom všech scopes pro autocompletion. | `sc.team.add`, `sc.projects.update` |
| **`RoleRef`** | Odkaz na roli ve formátu `area.roleName`. | `"team.administrator"` |
| **`ROLE_KEYS`** | Typově bezpečné klíče rolí. | `ROLE_KEYS.team.owner` |
| **`META_EXPANSION`** | Mapuje meta-scope na jemné scopy. | `team:write` → `team:add/read/remove/update` |
| **`ScopeGuard`** | Komponenta pro zobrazení UI podle oprávnění. | `<ScopeGuard anyOf={[sc.projects.read]}>...</ScopeGuard>` |
| **`useHasAny` / `useHasAll`** | Hooky pro podmíněné povolení / zakázání akce. | `useHasAny([sc.projects.update])` |

---

## 🧩 Použití v praxi (Cookbook)

### 1️⃣ Tlačítka / akce v UI

```tsx
<ScopeGuard anyOf={[sc.team.add]}>
  <Button onClick={openInvite}>Nový člen</Button>
</ScopeGuard>

<ScopeGuard anyOf={[sc.projects.update, sc.projects.assign]}>
  <Button onClick={assign}>Přiřadit projekt</Button>
</ScopeGuard>
```

### 2️⃣ Meta-scope (`team:write`)

```tsx
<ScopeGuard anyOf={[sc.team.write]}>
  <Button>Správa týmu</Button>
</ScopeGuard>
```

### 3️⃣ Role bundly (`team.administrator`, `team.owner`)

```tsx
import { ROLE_KEYS as rk } from '@/rbac';

<ScopeGuard anyOf={[rk.team.administrator]}>
  <Button>Administrace týmu</Button>
</ScopeGuard>

<ScopeGuard anyOf={[rk.team.owner]}>
  <Button>Akce jen pro vlastníka</Button>
</ScopeGuard>
```

### 4️⃣ Kombinace `anyOf` / `allOf`

```tsx
// musí mít všechny scopy
<ScopeGuard allOf={[sc.projects.update, sc.files.upload]}>
  <Button>Commit + upload</Button>
</ScopeGuard>

// stačí jeden z uvedených scopů
<ScopeGuard anyOf={[sc.projects.read, sc.team.read]}>
  <Panel>Uživatel má aspoň nějaké právo číst</Panel>
</ScopeGuard>
```

### 5️⃣ Hooky pro stav UI

```tsx
const canCreate = useHasAny([sc.projects.create]);

<Button onClick={createProject} disabled={!canCreate}>
  Nový projekt
</Button>
```

### 6️⃣ Navigace / menu

```tsx
const items = [
  { label: 'Projekty', to: '/projects', scopes: [sc.projects.read] },
  { label: 'Tým', to: '/team', scopes: [sc.team.read] },
];

<ul>
  {items.map(i => useHasAny(i.scopes) && (
    <li key={i.to}><NavLink to={i.to}>{i.label}</NavLink></li>
  ))}
</ul>
```

### 7️⃣ Route guard

```tsx
<ScopeGuard anyOf={[sc.projects.read]} fallback={<Navigate to="/403" />}>
  <ProjectsPage />
</ScopeGuard>
```

### 8️⃣ DataTable – per-row akce

```tsx
const rowActions = (row: ProjectSummaryDto) => (
  <>
    <ScopeGuard anyOf={[sc.projects.update]}>
      <IconButton icon="edit" onClick={() => edit(row.id)} />
    </ScopeGuard>
    <ScopeGuard anyOf={[sc.projects.archive]}>
      <IconButton icon="archive" onClick={() => archive(row.id)} />
    </ScopeGuard>
  </>
);
```

### 9️⃣ Disable místo hide

```tsx
const canDelete = useHasAny([sc.projects.delete]);

<Button disabled={!canDelete} onClick={() => canDelete && del(id)}>
  Smazat
</Button>
```

### 🔟 Smíšené vstupy (Scope + RoleRef)

```tsx
<ScopeGuard anyOf={[ROLE_KEYS.team.administrator, sc.projects.read]}>
  <Button>Panel pro admina týmu nebo kohokoli s read na projektech</Button>
</ScopeGuard>
```

---

## 🧠 Doporučení

- Vždy preferuj jemné scopy (`team:add`, `projects:update`) pro jednotlivé UI akce.  
- Meta-scopy (`team:write`) používej pro celé sekce nebo moduly.  
- Role bundly (`team.administrator`) jsou vhodné pro širší přístup (dashboardy, konfigurace).  
- FE i BE používají **stejný textový formát `area:action`**, takže guardy a `@PreAuthorize` jsou zrcadlové.

---

## 🧩 Přehled helperů

| Funkce | Popis |
|--------|--------|
| `of(...items)` | vytvoří `ReadonlySet` |
| `union(...sets)` | sjednocení množin |
| `minus(base, remove)` | rozdíl množin |
| `expandScopes([...])` | (interní) rozbalí meta-scopy a RoleRef na jemné scopy |

---

## 🧪 Testované scénáře

- `ScopeGuard` reaguje na změnu `user.scopes` z AuthContextu.
- `team:write` správně expanduje na `read/add/remove/update`.
- `ROLE_KEYS.team.owner` zahrnuje všechny scopy z `administrator` + `team:remove`.
- Hooky `useHasAny` / `useHasAll` vracejí očekávané hodnoty při přidání nebo odebrání scope.

---

## 🔧 Synchronizace s backendem

Na BE existuje ekvivalentní katalog `Scopes.java` a `BuiltInRoles.java`.  
Při přidání nové domény nebo akce:
1. přidej `area` a `action` do `AREAS` / `ACTIONS`;
2. vytvoř alias v `sc`;
3. aktualizuj BE konstanty a případně role.

---

**Autor:** STAVBAU Team  
**Verze:** RBAC FE v2 (2025-10-12)  
**Konzistence:** plná s RBAC 2.1 BE
