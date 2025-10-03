<MODULE_NAME> = Projects
<Module> = Projects
<module> = projects
<ModuleDto> = Project
<resource> = projects

# 🔰 FE Skeleton – Modul <MODULE_NAME> (by feature)
- Dodržuj: STAVBAU_GUIDELINES.md, REPO_GUIDELINES.md, PROJECT_SETUP.md, RBAC_2.1_STAVBAU_V2.md, hotovo-todo-future.md
- UI: používej `stavbau-ui` (Drawer, ConfirmModal, Button)

## Kontekst / zdroje pravdy
- Backend docs: /docs v backend repu (větev `main`) - https://github.com/preisvladimir/stavbau-backend-v2/tree/main/docs
- Repozitáře:
    - BE: https://github.com/preisvladimir/stavbau-backend-v2
    - FE: https://github.com/preisvladimir/stavbau-frontend-v2   

## Ukázková struktura a kódy
   - FE: https://github.com/preisvladimir/stavbau-frontend-v2/tree/main/src/features/teamV2

## Backend <MODULE_NAME> kódy a struktura
   - BE: https://github.com/preisvladimir/stavbau-backend-v2/tree/main/src/main/java/cz/stavbau/backend/projects

## Cíl
Vytvoř „by feature“ skeleton modulu **<MODULE_NAME>** s listem, detailem (drawer) a formulářem (drawer) + API klient a typy, i18n, RBAC hooky/guards, test scaffolding. Nejprve Step Plan (bez kódu), po schválení kód.

## Výsledná struktura (v FE repu)
src/features/<module>/
├─ api/
│  ├─ client.ts               // axios wrapper + metody
│  └─ types.ts                // DTO
├─ components/                // všechny komponenty
│  ├─ <Module>Table.tsx       // list
│  ├─ <Module>Form.tsx
│  ├─ <Module>DetailDrawer.tsx
│  └─ <Module>FormDrawer.tsx
├─ hooks/                       
│  └─ use<Module>Stats.ts        // např. "Stats"
├─ mappers/                       
│  └─ <Module>Mappers.ts         // mapper pro modul
├─ pages/
│  └─ <Module>Page.tsx       // list + search + paging + otevření drawerů
└─ validation/
   └─ <Module>Schema.ts       // schema
 


+ i18n: src/i18n/cs/<module>.json
+ test scaffolding: src/features/<module>/__tests__/*
+ případné utily: src/features/<module>/mappers.ts

## API kontrakt (DOPLŇ)
- Endpointy:
    - GET   /api/v1/<resource>?q=&page=&size=  → PageResponse<<ModuleDto>SummaryDto>
    - GET   /api/v1/<resource>/{id}            → <ModuleDto>Dto
    - POST  /api/v1/<resource>                 → Create<ModuleDto>Request → 201 + {id}
    - PATCH /api/v1/<resource>/{id}            → Update<ModuleDto>Request → 200
    - DELETE /api/v1/<resource>/{id}           → 204
- ProblemDetail (RFC7807) pro chyby.
- Specifikuj přesně pole DTO: <ModuleDto>Dto, <ModuleDto>SummaryDto, Create/Update requests (včetně nullability).
- PageResponse<T>: { items: T[]; page: number; size: number; total: number; }

## RBAC / toggly
- Aktuální scope prefix: <SCOPE_PREFIX> (např. `invoices:*`) – FE má číst ze `/auth/me` (JWT scopes)
- Připrav přepínatelnou mapu na budoucí `module:*` bez zásahu do UI.
- Guards/hooky: `useHasScope`, `ScopeGuard`, `RequireScope`

## UX / routy
- `/app/<module>` – list
- `/app/<module>/:id` – detail drawer
- `/app/<module>/new` (route přes `:id=new`) – form drawer (create)
- Debounced search (350 ms), stránkování, klientské třídění alespoň podle `name`/`updatedAt`
- Empty/Loading/Error states (stavbau-ui)
- Delete přes ConfirmModal (stavbau-ui), ostatní přes drawery

## i18n
- Namespace: `<module>.json`
- Klíče:
    - `<module>.list.*` (title, searchPlaceholder, emptyTitle, emptyDesc)
    - `<module>.form.*` (pole, validace, tlačítka)
    - `<module>.detail.*`
    - `errors.*` (obecné chybové texty)
- Mapování scopes → lidské labely pro tooltippy/disabled stavy

## Test Plan (scaffolding)
- Unit: RBAC hooky; API klient (success/401/403)
- Integration (RTL): Table render, form validation (happy/sad), optimistic UI
- E2E (Cypress): login → list → create → edit → delete
- Contract test: ověření tvaru PageResponse & DTO (mock server)

## CI/PR & governance
- PRs ~200 LOC:
    1) feat(<module>): list + API client
    2) feat(<module>): create/edit (form drawer)
    3) feat(<module>): detail (detail drawer)
    4) feat(<module>): delete + confirm
    5) feat(<module>): RBAC toggles + i18n
    6) test(<module>): unit/integration/e2e scaffolding
- Dodrž PR šablonu, labels `feature`, `ui`, `sprint-X`
- Po každém PR aktualizovat `hotovo-todo-future.md`

---

## Teď prosím:
1) Vygeneruj **Step Plan** pro skeleton <MODULE_NAME> podle výše uvedeného.
2) Po schválení Step Planu vygeneruj kód pro všechny soubory skeletonu (bez business logiky; jen volání API, typy, placeholder UI s i18n a guards).
3) Zkontroluj konflikt s existujícími komponentami (duplicitám se vyhni; použij `stavbau-ui`).
