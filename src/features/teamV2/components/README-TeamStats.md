# Statistiky Týmu – README (CZ) - revidováno 13.10.2025

Tento dokument popisuje, jak ve STAVBAU-V2 zprovoznit a používat **statistiky týmu** postavené na `teamService(companyId).stats()` a komponentě `TeamStats`. Součástí je i ukázka samostatné stránky `StatsPage` a adaptačních router komponent.

---

## Co komponenta dělá

`TeamStats` načte z BE agregované statistiky členů firmy a zobrazí je ve dvou blocích:

1. **Přehledové tile karty** – vlastníci, aktivní, pozvaní, deaktivovaní, archivovaní, celkem.
2. **Rozpad podle rolí** – hodnoty z `byRole` (mapa `CompanyRoleName -> count`).

Komponenta je čistě prezentační + vlastní fetch (bez závislosti na stránce), má **loading skeletony** a **error banner**.

---

## API – BE

Z `team-service.ts` dostupná metoda:

```ts
teamService(companyId).stats(): Promise<MembersStatsDto>
```

**`MembersStatsDto`**:

```ts
type MembersStatsDto = {
  owners: number;
  active: number;
  invited: number;
  disabled: number;
  archived: number;
  total: number;
  byRole: Partial<Record<CompanyRoleName, number>>;
};
```

> `CompanyRoleName` vychází z RBAC (viz `@/types/common/rbac`).

---

## Komponenta `TeamStats`

**Umístění:** `src/features/teamV2/components/TeamStats.tsx`

### Props

```ts
export type TeamStatsProps = {
  companyId: UUID | string;
  i18nNamespaces?: string[];            // default: ['team', 'common']
  autoRefreshMs?: number | false;       // automatická obnova (např. 30000), false = vypnuto
  className?: string;
  rolesOrder?: ReadonlyArray<CompanyRoleName>; // pořadí/filtrace rolí v „Podle role“
  onClickStat?: (key: keyof MembersStatsDto) => void; // klik na přehledový tile
  onClickRole?: (role: CompanyRoleName) => void;      // klik na řádek role
};
```

### Použití

```tsx
<TeamStats
  companyId={companyId}
  i18nNamespaces={['team', 'common']}
  autoRefreshMs={30_000}
  rolesOrder={VISIBLE_ROLES}
  onClickStat={(k) => {
    // např. otevřít Team list s filtrem stavu
    // if (k === 'invited') navigate('?status=INVITED');
  }}
  onClickRole={(role) => {
    // např. otevřít Team list s filtrem role
    // navigate('?role=' + role);
  }}
/>
```

> `VISIBLE_ROLES` je readonly pole rolí z RBAC, které určuje výchozí pořadí.

---

## Samostatná stránka `StatsPage`

**Umístění:** `src/features/teamV2/pages/StatsPage.tsx`

Stránka je „tenká“ obálka nad `TeamStats`, předává `companyId` a definuje texty pro hlavičku. Lze ji rovnou zařadit do routeru (viz dále).

```tsx
<StatsPage
  companyId={companyId}
  i18nNamespaces={['team', 'common']}
  autoRefreshMs={30_000}
/>
```

---

## Napojení do Routeru

### Varianta A – `companyId` v URL

- **Route adaptor**: `StatsPageRoute.tsx` načte `companyId` z `useParams()`.
- **Router**:

```tsx
{
  path: "companies/:companyId/teamstats",
  element: (
    <ScopeGuard required={["team:read", "team:write"]}>
      <StatsPageRoute />
    </ScopeGuard>
  ),
}
```

### Varianta B – `companyId` z kontextu

- **Context**: (pokud používáš „aktuální firmu“ v celé aplikaci)
- **Route adaptor**: `StatsPageBound.tsx` vezme `companyId` z contextu a předá do `StatsPage`.
- **Router**:

```tsx
{
  path: "teamstats",
  element: (
    <ScopeGuard required={["team:read", "team:write"]}>
      <StatsPageBound />
    </ScopeGuard>
  ),
}
```

### Varianta C – automaticky (param má přednost, jinak context)

- **Route adaptor**: `StatsPageAuto.tsx` zkombinuje param i context.
- **Router**: můžeš mít oba patterns:
  - `teamstats`
  - `companies/:companyId/teamstats`

---

## i18n klíče (doporučení)

V `team` namespace:

```jsonc
{
  "stats": {
    "title": "Statistiky týmu",
    "updatedHint": "Aktualizuje se automaticky",
    "owners": "Vlastníci",
    "active": "Aktivní",
    "invited": "Pozvaní",
    "disabled": "Deaktivovaní",
    "archived": "Archivovaní",
    "total": "Celkem",
    "byRole": "Podle role",
    "page": {
      "title": "Statistiky týmu",
      "autorefreshOn": "Auto-refresh zapnut",
      "autorefreshOff": "Auto-refresh vypnut"
    }
  },
  "roles": {
    // existující překlady rolí, např. OWNER, ADMIN, ...
  }
}
```

---

## Styling & UX

- **Skeletony**: dlaždice i řádky rolí mají skeleton stav pro lepší vnímání načítání.
- **Badge/tones**: přehledové karty používají jemné „ring“ zvýraznění pro důležitější metriky (např. „Celkem“).
- **Klikatelnost**: obal `onClickStat` / `onClickRole` umožňuje napojit statistiky na filtr v seznamu členů.
- **Readonly kolekce**: `rolesOrder` a `VISIBLE_ROLES` jsou readonly – komponenta s nimi nemanipuluje (čitelnost a bezpečí).

---

## Testování

- **Render bez dat** → skeletony.
- **Render s chybou** → zobrazí se `LoadErrorStatus`.
- **Auto-refresh** → ověř, že se periodicky volá `teamService(companyId).stats()` (lze mockovat `api.get`).

---

## Troubleshooting

- **TS4104: readonly pole vs. `string[]`**  
  Změň typ `rolesOrder` na `ReadonlyArray<CompanyRoleName>` a používej readonly i interně:
  ```ts
  rolesOrder?: ReadonlyArray<CompanyRoleName>;
  const roleKeys: ReadonlyArray<CompanyRoleName> = useMemo(
    () => rolesOrder ?? VISIBLE_ROLES,
    [rolesOrder]
  );
  ```

- **Chybí `companyId` v routeru**  
  Použij `StatsPageBound` (context) nebo `StatsPageRoute` (URL param).

---

## Checklist integrace

- [ ] Import `TeamStats` do stránky / page wrapperu.
- [ ] Předání `companyId` (z paramu nebo contextu).
- [ ] (Volitelně) Nastavit `autoRefreshMs`.
- [ ] (Volitelně) Napojit `onClickStat` a `onClickRole` na filtr v Team listu.
- [ ] Přidat i18n klíče do `team.json`.
- [ ] Zaregistrovat route (A/B/C varianta).

---

## Návrh commit message

```
feat(team): add TeamStats component and StatsPage; support auto refresh, role breakdown and router adaptors
```

---

## Další kroky (nice-to-have)

- Vydělit `useTeamStats(companyId)` hook, aby šel lépe testovat a sdílet.
- Přidat export CSV pro byRole tabulku.
- Přidat trendové šipky (dnes vs. minulý týden) – vyžaduje BE API rozšíření.
