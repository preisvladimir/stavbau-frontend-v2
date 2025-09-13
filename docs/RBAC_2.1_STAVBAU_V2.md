# RBAC 2.1 — STAVBAU‑V2 (Návrh k řízení)
*Aktualizace původního „Doménový návrh RBAC 2.0“ pro architekturu STAVBAU‑V2 (modular monolith by feature, Spring Boot 3.2, JWT + refresh rotace, i18n).*

---

## 0) Cíle a principy
- **Jeden model práv** pro dvě úrovně kontextu: **Company** a **Project**.
- **Scopes jako lego** (area:action) — nejmenší jednotka rozhodování.
- **Role = pojmenovaná množina scopes** (company role / project role).
- **Allow‑list only** (žádné deny seznamy), sjednocení práv přes více rolí = OR.
- **MVP in‑code, PRO v DB**, s cache a invalidací.
- **FE toggly** vycházejí z JWT + `/auth/me`; BE je autorita.
- **Modularita by feature** — vše kolem RBAC v modulu `security/rbac` (BE) a `src/features/auth/rbac` (FE).

---

## 1) Doménový model (kontexty, role, scopes)
### 1.1 Úrovně kontextu
- **Company‑level:** globální role uživatele v rámci firmy (např. OWNER, COMPANY_ADMIN, …) — udělují company scopes + některé cross‑project scopes.
- **Project‑level:** role v rámci **konkrétního** projektu (např. PROJECT_MANAGER, FOREMAN, …) — udělují project scopes vázané na `projectId`.

### 1.2 Scopes (area:action)
- **Formát:** `area:action` (malá písmena).
- **Příklady area:** `dashboard, projects, logbook, budget, tasks, files, team, invoices, admin, integrations`.
- **Příklady action:** `read, create, update, delete, approve, assign, upload, download, share, export, comment`.

### 1.3 Autority (Spring Security)
- **Company role:** `ROLE_OWNER`, `ROLE_COMPANY_ADMIN`, … (pro ladění; rozhodování dělá RBAC service).
- **Project role:** nepoužíváme ploché autority s ID; **kontext `projectId` řeší `RbacService`**. (Volitelně lze mít „plochou“ `ROLE_PROJECT_MANAGER` jen pro FE toggly.)
- **Scopes:** `SCOPE_projects:read`, `SCOPE_budget:approve`, … (dvojtečka zůstává).

### 1.4 Konvence (utils)
- `Scopes.PROJECTS_READ = "projects:read"` apod.
- `Authorities.toScopeAuthority("projects:read") -> "SCOPE_projects:read"`.

---

## 2) MVP katalog scopes (minimální, ale pokrývající MVP moduly)
> Rozsah držíme racionální; FE toggly + BE ochrana na metodách.

**Common / systém**
- `auth:me`, `admin:users_read`, `admin:users_manage`, `integrations:manage`

**Dashboard**
- `dashboard:view`

**Projects**
- `projects:read`, `projects:create`, `projects:update`, `projects:delete`, `projects:archive`, `projects:assign`

**Logbook (Deník)**
- `logbook:read`, `logbook:create`, `logbook:update`, `logbook:delete`, `logbook:export`

**Budget (Rozpočet)**
- `budget:read`, `budget:create`, `budget:update`, `budget:delete`, `budget:approve`, `budget:export`

**Tasks**
- `tasks:read`, `tasks:create`, `tasks:update`, `tasks:delete`, `tasks:assign`, `tasks:comment`

**Files**
- `files:read`, `files:upload`, `files:update`, `files:delete`, `files:download`, `files:share`

**Team**
- `team:read`, `team:add`, `team:remove`, `team:update_role`

**Invoices (volitelné v MVP)**
- `invoices:read`, `invoices:create`, `invoices:update`, `invoices:delete`, `invoices:approve`, `invoices:export`

---

## 3) Role → scopes (MVP in‑code)
### 3.1 Company role (globální)
- **OWNER**  
  Vše z `COMPANY_ADMIN` + `admin:users_manage`, `integrations:manage`; cross‑project `projects:create|archive`, `team:*`, `dashboard:view`.
- **COMPANY_ADMIN**  
  `dashboard:view`, `projects:read|create|update|assign`, `team:read|add|remove|update_role`, `admin:users_read`.
- **ACCOUNTANT**  
  `budget:read|export`, `invoices:read|export`.
- **PURCHASING**  
  `budget:read|update`, `files:read`.
- **DOC_CONTROLLER**  
  `files:read|upload|update|share|download`.
- **FLEET_MANAGER**  
  (volitelně) `files:read`, `tasks:read`.
- **HR_MANAGER**  
  `team:read` (+ případně integrační exporty).
- **AUDITOR_READONLY**  
  `dashboard:view` + `*:read` (bez zápisu).
- **INTEGRATION**  
  `integrations:manage`, čtení vybraných dat: `projects:read`, `logbook:read`, `budget:read`, `files:read` (volitelně).
- **VIEWER**  
  `dashboard:view`, `projects:read` (+ dle politiky další `*:read`).
- **SUPERADMIN**  
  Všechny scopes; mimo firmy pro provozní zásahy.

> Pozn.: schvalování rozpočtů se **neimplikuje** company rolí; patří do project rolí.

### 3.2 Project role (vázané na `projectId`)
- **PROJECT_MANAGER**  
  Téměř vše v projektu vč. `budget:approve`; `projects:read|update`, `logbook:* (vč. export)`, `budget:*`, `tasks:*`, `files:*`, `team:*`, `invoices:*`.
- **SITE_MANAGER (stavbyvedoucí)**  
  Operativa: `logbook:*` (bez export volitelně), `tasks:* (vč. assign)`, `files:read|upload|update|download`, `budget:read|update` (bez approve), `projects:read`, `team:read`.
- **FOREMAN (mistr)**  
  `logbook:read|create|update`, `tasks:read|create|update|comment`, `files:read|upload|download`, `projects:read`.
- **QS (rozpočtář)**  
  `budget:read|create|update|export` + **může mít** `budget:approve` (politika firmy).
- **HSE (BOZP)**  
  `logbook:read|create|update`, `files:read|upload|download`, `projects:read`, `tasks:read|create`.
- **DESIGNER**  
  `files:read|upload|download`, `tasks:read|comment`, `projects:read`, `logbook:read`.
- **SUBCONTRACTOR**  
  Omezený přístup: `tasks:read|update|comment` (jen přidělené), `files:download`, `projects:read (omezené)`, `logbook:read (omezené)`.
- **CLIENT**  
  `projects:read`, `budget:read (volitelně bez cen)`, `files:download`, `logbook:read (omezené)`, `tasks:read (omezené)`.
- **PROJECT_VIEWER**  
  `*:read` v rámci projektu.

> „Omezené“ = RbacService filtruje obsah (např. jen public/klientské záznamy). V MVP lze začít bez hlubokých obsahových filtrů a přidat je později.

---

## 4) Vyhodnocování přístupu
- **Allow‑list**: přístup jen pokud existuje odpovídající scope v kontextu.
- **Metody s `projectId`** → kontrolujeme projektové scopes přes `RbacService` a současně členství/roli na daném projektu.
- **Globální metody** → kontrolujeme company scopes.
- **Více rolí** = sjednocení scopes (OR).
- **SUPERADMIN** → bypass (vše povoleno).

---

## 5) Zdroj pravdy a perzistence
### 5.1 MVP (in‑code)
- `BuiltInScopes` (konstanty) — jediné místo s texty scopes.
- `BuiltInRoles` — dvě mapy:
    - `Map<CompanyRoleName, Set<String>> companyRoleScopes`
    - `Map<ProjectRoleName, Set<String>> projectRoleScopes`

### 5.2 PRO (DB + cache)
- **Tabulky:**
    - `scope_definitions(id, area, action, description)`
    - `roles(id, level ENUM('COMPANY','PROJECT'), name, display_name, description)`
    - `role_scopes(role_id, scope_id)`
    - `user_company_roles(user_id, company_id, role_id)`
    - `project_members(project_id, user_id, role_id)` (již máme; `role_id` → ProjectRoleName/ref)
    - *(volitelně)* `user_project_scopes_override(user_id, project_id, scope_id, grant_bool)`
- **Cache:** role→scopes, invalidace při změně.
- **Migrace:** mapování legacy `User.role` → `companyRole` + `project_members.role`.

---

## 6) JWT payload (MVP)
Cíl: FE toggly + BE rozhodování bez DB dotazu pro běžné cesty (membership si BE ověří při operaci na projektu).

```json
{
  "sub": "USER_UUID",
  "companyId": "COMPANY_UUID",
  "companyRole": "COMPANY_ADMIN",
  "projectRoles": [
    { "projectId": "PROJ_UUID_1", "role": "PROJECT_MANAGER" },
    { "projectId": "PROJ_UUID_2", "role": "FOREMAN" }
  ],
  "scopes": [
    "dashboard:view",
    "projects:read",
    "projects:create",
    "tasks:read",
    "files:read",
    "files:upload"
  ],
  "iat": 1693845600,
  "exp": 1696451200
}
```
- `scopes` = odvozené z `companyRole` + všech `projectRoles`.
- Pro metody nad projektem **NESTAČÍ** jen scopes — **ověřit vazbu user↔projectId** v `RbacService`.

---

## 7) Použití v kódu (Spring)
### 7.1 Anotace / SpEL příklady
- **Globální list projektů (company‑level):**
  ```java
  @PreAuthorize("@rbac.hasScope('projects:read')")
  ```
- **Operace na konkrétním projektu:**
  ```java
  @PreAuthorize("@rbac.canReadProject(#projectId)")
  @PreAuthorize("@rbac.hasProjectScope(#projectId, 'budget:approve')")
  ```
- **Deník – vytvoření záznamu:**
  ```java
  @PreAuthorize("@rbac.hasProjectScope(#projectId, 'logbook:create')")
  ```
- **Soubory – upload:**
  ```java
  @PreAuthorize("@rbac.hasProjectScope(#projectId, 'files:upload')")
  ```

### 7.2 `RbacService` rozhraní (návrh)
```java
public interface RbacService {
  boolean hasScope(String scope);
  boolean hasAnyScope(String... scopes);
  boolean hasProjectScope(UUID projectId, String scope);
  boolean canReadProject(UUID projectId);
  boolean isMemberOfProject(UUID projectId);
  Set<String> currentUserScopes(); // z JWT (cache v SecurityContextu)
}
```

### 7.3 Umístění v projektu (by feature)
- `src/main/java/cz/stavbau/backend/security/rbac/`
    - `Scopes.java` (konstanty)
    - `CompanyRole.java`, `ProjectRole.java` (enumy)
    - `BuiltInRoles.java` (mapy role→scopes)
    - `RbacService.java`, `RbacServiceImpl.java`
    - `RbacMethodSecurityConfig.java` (povolení @PreAuthorize s bean `rbac`)
    - `SecurityUtils.java` (helpery k JWT a principalu)

---

## 8) Frontend (toggly & routing)
- **Zdroj pravdy:** `/auth/me` + JWT (z hlavičky) → FE si drží `companyRole`, `projectRoles[]`, `scopes[]`.
- **Hooky:** `useHasScope(scope)`, `useHasProjectScope(projectId, scope)`, `useIsProjectMember(projectId)`.
- **Route guards / komponenty:** `<RequireScope scope="projects:read">...</RequireScope>`.
- **UI toggly:** tlačítka a akce se zobrazují jen při splnění scope; **BE stejně kontroluje** na API.
- **i18n:** názvy rolí a scopes mapovat na přeložené labely (pro administraci oprávnění v budoucnu).

---

## 9) Testování a kvalita
- **Unit testy** pro `BuiltInRoles` (katalog není rozbitý) a `RbacService` (kombinace rolí).
- **Slice testy** na kontrolery se Spring Security (`@WebMvcTest`) — 403 pro chybějící scope/member.
- **E2E happy paths** pro klíčové flows (login, list projektů, deník CRUD, budget approve).
- **Contract testy FE/BE** pro toggly vs. reálné chování backendu.
- **Static analysis**: varování na nechráněné kontrolery v citlivých modulech.

---

## 10) Migrace RBAC 2.0 → 2.1 (STAVBAU‑V2)
1. **Založit modul** `security/rbac` a vložit konstanty `Scopes`, enumy rolí, `BuiltInRoles`.
2. **Implementovat `RbacService`** a povolit method security.
3. **Upravit JWT vydávání**: dopočítat `scopes[]` z company + project rolí.
4. **Anotovat kontrolery** v MVP modulech (projects, logbook, budget, tasks, files, team, admin).
5. **FE toggly**: doplnit hooky/guards podle `scopes[]`, načítat `/auth/me`.
6. **Testy**: unit + mvc slice + e2e (viz výše).
7. **(PRO fáze)**: Flyway tabulky (viz kap. 5.2), CRUD pro role/scopes admin UI, cache invalidace.

---

## 11) Přílohy
### 11.1 Minimální role‑to‑scope matrix (FE orientačně)
- **Company:**
    - OWNER → vše + admin + integrations
    - COMPANY_ADMIN → `dashboard:view`, `projects:*` (bez delete), `team:*`, `admin:users_read`
    - VIEWER → `dashboard:view`, `projects:read`
    - AUDITOR_READONLY → `*:read`
- **Project:**
    - PROJECT_MANAGER → `*:all` v projektu + `budget:approve`
    - SITE_MANAGER → operativa bez `budget:approve`
    - QS → `budget:*` (+ často `budget:approve`)
    - PROJECT_VIEWER → `*:read`

> Přesné vyhodnocení vždy na BE, FE matrix slouží pro UX toggly.

---

## 12) Soulad s STAVBAU‑V2 guidelines
- **Modular monolith by feature**: RBAC je samostatný modul, ne prosakující utilita.
- **Nepsat dopředu**: začínáme MVP katalogem scopes/rolí a postupně rozšiřujeme.
- **Checkpointy**: po nasazení RBAC základů zapiš do `hotovo-todo-future.md`.
- **CI/PR**: změny v RBAC vyžadují CODEOWNERS review (security).

---

**Tento dokument je závazný pro návrh i implementaci RBAC ve STAVBAU‑V2.**  
V případě rozporu s reálnými potřebami sprintu: navrhni změnu dokumentu a proveď jí přes PR.
