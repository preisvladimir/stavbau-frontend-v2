# 🗂 hotovo-todo-future.md

## ✅ HOTOVO

### 8. 9. 2025 --- Inicializace projektu

-   **Maven projekt** (Java 17, Spring Boot 3.2.x) + základní `pom.xml`
    (web, security, validation, data-jpa, Flyway, PostgreSQL, MapStruct,
    OpenAPI).\
-   **Kostra aplikace**: `StavbauBackendApplication`, `application.yml`
    (datasource, Flyway, JWT dev secret).\
-   **i18n základ**: `MessageSourceConfig` (`messages_cs/en`),
    `AcceptHeaderLocaleResolver` (default cs).
    -   `PingController` + návrat hlavičky `Content-Language`.\
-   **Bezpečnost & infrastruktura**:
    -   `SecurityConfig`: stateless, CSRF off, povoleno `/actuator/**`,
        `/v3/api-docs/**`, `/swagger-ui/**`, `/api/v1/auth/**`,
        `/api/v1/ping`.\
    -   `ApiExceptionHandler` (RFC7807 styl).\
    -   `BaseEntity` + auditing (`JpaAuditingConfig`).\
-   **Databáze (Docker) & migrace**:
    -   Postgres 16 (Docker), síť + volume, předinstalace `uuid-ossp`.\
    -   Flyway:
        -   V1: `companies`, `users` (základ, locale, company_id).\
        -   V2: `users` rozšířeno o `token_version` a `refresh_token_id`
            (refresh rotace).\
-   **Oprava závislostí**: odstraněny konfliktní Hypersistence Utils
    (Hibernate 6.4).
    -   ponechána `hibernate-types-60` (JSONB apod.).\
-   **JWT autentizace (header) + refresh v HttpOnly cookie**
    -   `PasswordEncoder` (BCrypt, cost=12).\
    -   `JwtService`: vydávání access (krátká TTL) + refresh (aud
        „refresh", jti, ver).\
    -   `RefreshCookie`: HttpOnly, SameSite=Lax, path „/".\
    -   `JwtAuthenticationFilter`: načítá Bearer token →
        `UsernamePasswordAuthenticationToken`.\
    -   `AppUserPrincipal`: změněn na POJO (fix 500 na `/auth/me`).\
-   **AuthController**:
    -   `POST /auth/login` → access v těle + refresh cookie (rotace
        jti).\
    -   `POST /auth/refresh` → validace cookie (aud/ver/jti), rotace +
        reuse detekce.\
    -   `POST /auth/logout` → smaže cookie + zneplatní jti.\
    -   `GET /auth/me` → vrací `userId`, `companyId`, `email`.\
-   **Entity & repo**:
    -   `User` bez Lomboku (ruční gettery/settery).\
    -   `Company` + obě repository (`UserRepository`,
        `CompanyRepository`).\
-   **Dev seeding**:
    -   `DevUserSeeder` (profil dev\|default): firma + admin
        `admin@stavbau.local` / `admin123`.\
-   **Testy (PowerShell)**:
    -   `/api/v1/ping` (200, Content-Language).\
    -   `/auth/login` → získání access tokenu + refresh cookie.\
    -   `/auth/me` s Bearer.\
    -   `/auth/refresh` (nový access, cookie rotace).\
    -   `/auth/logout` (204).\
-   **Rate limiting (příprava)**:
    -   použití Bucket4j 7.6.0.\
    -   `RateLimitFilter` (per-IP, např. 10/min + 3/10s).\
    -   `SecurityConfig`: řetězení filtrů (rate-limit → JWT →
        UsernamePasswordAuthenticationFilter).
-   **GitHub repozitáře** založeny:
    - Backend: `https://github.com/preisvladimir/stavbau-backend-v2`
    - Frontend: `https://github.com/preisvladimir/stavbau-frontend-v2`
-   **Backend – první commit**: přidány dokumenty (`/docs`), `README.md`, `CHANGELOG.md`, `.gitignore`, základní BE skeleton (Spring Boot), Flyway migrace, i18n, security, JWT, rate-limit filtr (příprava).
- **Oprava remote**: backend byl omylem napojen na `frontend-v2`; remote opraven a obsah přesunut do správného repozitáře.
- **CI (backend)**: přidán workflow `backend-ci.yml` (Java 17 + Maven) a pushnut do `main`.
- **Repo metainfra – návrh**: připraveny `.gitattributes` (LF default) a `.editorconfig` (konzistentní formát); doporučeno commitnout.
- **Pokyny a šablony**: `STAVBAU_GUIDELINES.md`, `STAVBAU_TEMPLATES.md`, `POKYNY_GITHUB.md` a workflow šablony připraveny.

### 9. 9. 2025 --- Plánování RBAC BE (MVP)

- **🕒 Milník (plánování):** RBAC BE (MVP) – Step Plan schválen.
- **TODO (Sprint 2):**
    - Implementovat `security/rbac` (Scopes, CompanyRoleName, ProjectRoleName, BuiltInRoles).
    - `RbacService` + `RbacServiceImpl`, `RbacMethodSecurityConfig`.
    - Úpravy `AppUserPrincipal` a `JwtService` – claims: `companyRole`, `projectRoles[]`, `scopes[]`.
    - `/auth/me` rozšířit o `companyRole`, `scopes[]`.
    - Anotace pilotních endpointů (`projects:read`, `projects:create`).
    - Doplnit i18n klíče pro 401/403 (auth.forbidden_missing_scope).
    - Testy: unit (`BuiltInRolesTest`, `RbacServiceTest`), slice (`WebMvcTest` 401/403/200), integrační happy path.
- **FUTURE:**
    - Projektové role + `hasProjectScope` enforcement (Sprint 3).
    - DB perzistence rolí/scopes (PRO fáze).
    - Admin UI pro správu rolí.

### 9. 9. 2025 — RBAC základ + JWT filtry (BE)

**HOTOVO**
- Přidán skeleton RBAC modulu (`security/rbac`): `Scopes`, `CompanyRoleName`, `ProjectRoleName`, `ProjectRoleAssignment`, `BuiltInRoles` (prázdné mapy pro MVP), `RbacService` + `RbacSpelEvaluator`, `RbacMethodSecurityConfig`. :contentReference[oaicite:0]{index=0}
- `JwtService` rozšířen o RBAC claims (`companyRole`, `projectRoles[]`, `scopes[]`) + helpery `extract*`. :contentReference[oaicite:1]{index=1}
- `JwtAuthenticationFilter` refaktor: mapuje JWT → `AppUserPrincipal`; generuje `ROLE_*` a `SCOPE_*` authorities. :contentReference[oaicite:2]{index=2}
- `SecurityConfig` opraveno pořadí filtrů: **RateLimit → JWT → UsernamePasswordAuthenticationFilter** (oba ankory před vestavěný filtr).
- Aplikace startuje, autentizace běží (login/refresh), základ pro `@PreAuthorize("@rbac…")` připraven. :contentReference[oaicite:3]{index=3}

**TODO (Sprint 2)**
- Naplnit `BuiltInRoles.companyRoleScopes` podle RBAC_2.1 (OWNER, COMPANY_ADMIN, …). :contentReference[oaicite:4]{index=4}
- `/auth/me` rozšířit o `companyRole`, `projectRoles[]`, `scopes[]`; FE toggly budou čerpat z API. :contentReference[oaicite:5]{index=5}
- Anotovat pilotní endpointy: `projects:read`, `projects:create` přes `@PreAuthorize("@rbac.hasScope('…')")`. :contentReference[oaicite:6]{index=6}
- Testy: unit (`BuiltInRolesTest`, `RbacServiceImplTest`), slice (`@WebMvcTest` 401/403/200), integrační happy-path login → chráněný endpoint. :contentReference[oaicite:7]{index=7}
- i18n: doplnit klíče pro 401/403 (`auth.forbidden_missing_scope`, …).

**FUTURE**
- Project role enforcement (`hasProjectScope`, `canReadProject`) + membership check (Sprint 3). :contentReference[oaicite:8]{index=8}
- PRO fáze: RBAC v DB + admin UI, cache & invalidace. :contentReference[oaicite:9]{index=9}

## HOTOVO – 2025-09-10
- DB init přes Flyway: companies, company_nace, users (V2025_09_10_000)
- Doplňkové migrace: registered_address radek_adresy1/2 (V2025_09_10_001)
- Sjednocení názvů: tabulka `companies`, FK users.company_id → companies(id)
- MapStruct: vypnutý builder, ignorace auditních polí, AresCompanyMapper + CompanyMapper OK
- ARES integrace: DTO (AresSubjectDto), mapper, service skeleton, WebFlux v pom.xml
- AresCompanyMapper – sjednoceny ignore mapping pro single i legacy tvary payloadu.
- RegistrationStatuses: dočasně @Transient

## TODO (další sprint)
- AresClient+Service testy (MockWebServer), AresCompanyMapper testy
- Endpoint POST /api/companies/import/ares → persist & upsert
- Security pravidla pro `/api/companies/lookup/**`
- (Rozhodnout) Persist `RegistrationStatuses` – sloupce nebo JSONB snapshot

## FUTURE
- Validace IČO mod 11 (BE), FE hinty dle ARES
- Indexy pro vyhledávání: ico, okres_nuts_lau, dor_obec/psc (pokud bude potřeba)

### 11. 9. 2025 — Analýza & plán integrace GEO (Mapy.cz API)

**HOTOVO (analýza & plán):**
- Provedena analýza balíčku **geo.zip** z verze 1.
- Navržen **Step Plan** pro migraci do STAVBAU-V2: modular-by-feature, bezpečná konfigurace (API key v ENV), caching (Caffeine), testy (unit + integrační), FE hook (debounce input).

**TODO (implementace):**
- Vytvořit balíček `cz.stavbau.backend.geo` se strukturou `config/`, `service/`, `controller/`, `dto/`.
- Přidat `MapyCzProperties` + `application.yml` (`mapycz.*` s `${MAPYCZ_API_KEY}`).
- Implementovat `GeoConfig` (WebClient s timeouty, UA header, error filter).
- Dopsat `AddressSuggestion` (všechna pole) a mapper z odpovědi Mapy.cz.
- Opravit/doplnit `MapyCzGeoService.suggest(...)` – validace vstupů, normalizace `q`.
- Přidat cache layer (Caffeine) pro suggest.
- `GeoController` – `GET /api/geo/suggest`, zapojit rate-limit filtr.
- Testy jednotkové + integrační (ok/chyby/timeouty/edge cases).
- OpenAPI (schema DTO) + README pro geo modul.
- FE: `api.geo.suggest()` + debounce input (demo stránka „Projekt – adresa“).

**FUTURE (rozšíření):**
- Reverse geocoding (lon/lat → adresa).
- Geocoding přes více providerů (fallback).
- Perzistence „posledních výběrů“ pro UX.
- Validace PSČ podle země, normalizace diakritiky, detekce duplicit.
- Mapové widgety (piny, bbox zoom) v projektu a fakturaci.

### 11. 9. 2025 — Docker Compose + .gitignore pro GEO API key

- Přidán `docker-compose.yml` s předáním **MAPYCZ_API_KEY** do služby `backend`.
- Doplněna pravidla do `.gitignore` pro **.env** a **.env***.
- Pozn.: Compose načítá `.env` automaticky ze stejné složky jako `docker-compose.yml`.

### 12. 9. 2025 — GEO fix Swagger + Mapy.com
- GeoController: explicitní `@RequestParam(name=...)` → Swagger generuje `q/limit/lang` (ne arg0/1/2).
- maven-compiler: `<parameters>true</parameters>` kvůli názvům paramů.
- MapyCzClient: `/v1/geocode` + `query=`.
- GeoService: bbox z listu [minLon,minLat,maxLon,maxLat]; regionalStructure.isoCode.
- Smoke test /api/v1/geo/suggest OK.

### 12. 9. 2025 — Integrations/Weather (Meteostat RapidAPI)
- Přidán modul `integrations/weather` (WebClient, klient, service, controller).
- Endpoint: `GET /api/integrations/weather/summary?lat&lon&date[&alt]`.
- Účel: inline použití v Deníku (automatické doplnění počasí k záznamu).


### 12. 9. 2025 — Sprint 4: Finance & Dokumentace (MVP start)
**HOTOVO (plán):**
- Detailní Step Plan pro moduly Invoices & Files (BE/FE/DB/i18n/RBAC).
- Návrh DB schémat (Invoice, InvoiceLine, NumberSeries, StoredFile, FileTag, FileLink).
- API kontrakty v1 pro faktury a soubory.
- Akceptační kritéria + test plan.

**TODO (implementace):**
- [BE] Flyway migrace `invoices` + `files`.
- [BE] Services: NumberSeriesService, InvoiceService, InvoicePdfService, StoredFileService.
- [BE] Controllers + RBAC anotace + Swagger.
- [FE] Stránky /invoices a /files, formuláře, RBAC guardy.
- [FE] API klienti invoices/files, i18n texty.
- [QA] Unit/Integration/E2E testy, CI green.

**FUTURE (PRO rozšíření):**
- Verzování souborů, soft-delete/restore.
- Rozšířené číselné řady (více patternů, per projekt).
- Šablony PDF (branding per company), vícejazyčné PDF.
- S3/MinIO storage, AV scanning, signed URLs.

### 12. 9. 2025 — Fix WebClient kolize
- MapyCzClient nyní používá @Qualifier("geoWebClient"), aby nedocházelo ke kolizi s meteostatWebClient.

### 13. 9. 2025 — Sprint 4: Finance a dokumentace (Invoices & Files)

**HOTOVO**
- Přidán modul **Invoices**:
    - `NumberSeriesService` + unit testy (rezervace čísel, atomická transakce).
    - `InvoiceService` (CRUD, vystavení, změna stavu).
    - `InvoiceController` + DTOs + Swagger anotace.
    - Integrační test (`MockMvc`) pro základní akce.
- Přidán modul **Files**:
    - Entita `StoredFile`, `FileTag`.
    - Služba `StoredFileServiceImpl` + jednotkové testy.
    - `FileStorage` interface + implementace `LocalFsStorage` (bean).
    - REST API: upload, download, tag management (RBAC scopes `files:*`).
- RBAC:
    - Anotace endpointů `@PreAuthorize` s využitím `invoices:*`, `files:*` (dle RBAC_2.1).
- CI prošlo (backend build + testy zelené).

**TODO (další krok ve Sprintu 4):**
- Implementace `InvoicePdfService` (export faktur do PDF s i18n formátováním).
- Propojení faktur s ARES (automatické doplnění odběratele).
- FE demo: modul fakturace + file upload (propojení s BE API).
- Integrační testy `StoredFileController` (MockMvc: upload, download, 403 bez scope).

**FUTURE**
- Integrace se službou e-mailu: `InvoiceEmailService` (odeslání faktur zákazníkům).
- Rozšíření `FileStorage` o S3 implementaci (cloud).
- Verzionování souborů a archivace (PRO verze).

### 13. 9. 2025 — FE Auth MVP skeleton

**HOTOVO**
- Přidán skeleton autentizace na FE: `/login`, `AuthContext`, Axios klient + interceptory (TODO), guardy (`ProtectedRoute`, `ScopeGuard`), router a layout, i18n (common/auth/errors).
- Vytvořeny DTO typy: `LoginRequest/Response`, `RefreshRequest/Response`, `MeResponse`.

**TODO (další PR)**
- Implementace RHF + Zod validace ve `LoginPage`.
- Implementace interceptorů včetně refresh singleflight a 401→retry.
- Napojení `/auth/me` a naplnění `AuthContext` (user, role, scopes).
- UI toggle podle scopes v Sidebar/Projects.
- Unit & e2e testy dle plánu.

**FUTURE**
- Persist bez localStorage (rehydratace přes `/auth/me` po refreshi).
- HttpOnly cookie pro refresh (pokud BE umožní) + CSRF varianta.
- Captcha/slowdown při opakovaném 401/429.

### 14. 9. 2025 — FE Auth implementace (MVP)

**HOTOVO**
- LoginPage (RHF+Zod, i18n, loading, 401/429).
- Axios interceptory s refresh singleflight a 401→retry; 403/429 UX hooky.
- AuthContext napojen na /auth/me (po loginu) – naplnění user/role/scopes.
- RBAC toggly: Sidebar a Projects (button „Nový projekt“ jen se scope).
- Unit test: hasScope (anyOf/allOf), kostry pro guards/interceptors/e2e.

**TODO**
- Doplnit integrační test interceptorů (axios-mock-adapter).
- E2E: happy path login → dashboard, RBAC scénáře (Playwright/Cypress).
- UI rozšíření (toasty, show/hide password, vizuální stavy).
- Napojení reálných Projects API.

**FUTURE**
- Persist bez localStorage (volitelná rehydratace přes /auth/me).
- HttpOnly cookie refresh varianta (pokud BE povolí) + CSRF.
- Anti-bruteforce UX při 429 (cooldown/captcha).

### 14. 9. 2025 — FE Auth MVP + UI knihovna

**HOTOVO**
- FE autentizace:
    - `LoginPage` přepracován s **React Hook Form + Zod** validací, i18n hláškami, stavem loading, podporou 401/429.
    - Axios **interceptory** s refresh singleflight a retry pro 401, UX hooky pro 403/429.
    - **AuthContext** napojen na `/auth/me` – po loginu plní `user/role/scopes`.
    - RBAC toggly v **Sidebaru** a v Projects (scope `projects:create`).
- UI knihovna:
    - Základní komponenty sjednoceny: `Button`, `LinkButton`, `Badge`, `Card*` (Card, Header, Title, Description, Content, Footer).
    - Přidány helpery: `cn` utilita, `icons` index pro lucide-react.
    - Instalace a zapojení **class-variance-authority**, **clsx**, **lucide-react**.
    - Zavedeny design tokens (`sb-*` classes) pro konzistenci.
- i18n:
    - Struktura `i18n/` s namespacy `common`, `auth`, `errors`, `projects`.
    - Připojeno do providerů v `main.tsx`.

**TODO (další kroky Sprintu 2)**
- Integrační testy interceptorů (`axios-mock-adapter`).
- E2E testy login flow (happy path, RBAC scénáře) – Cypress/Playwright.
- UI rozšíření:
    - Toastery (shadcn/ui) místo fallback `console.log`.
    - Show/hide password toggle.
    - Lepší chybové/empty stavy.
- Napojení reálného **Projects API** (GET/POST).
- Dokončit CI pro frontend (lint, build, test).

**FUTURE**
- Persist stavů bez localStorage (rehydratace přes `/auth/me` po refreshi).
- Volitelná varianta s refresh tokenem v HttpOnly cookie + CSRF tokeny.
- UX při bruteforce/429 (cooldown, captcha).
- Rozšíření UI knihovny (`DataTable`, `Modal`, `EmptyState`) jako plnohodnotný „stavbau-ui“ balík pro všechny feature moduly.
- Konsolidace design tokens (`tokens.css`) a theming (dark mode).

## 🧭 Rozhodnutí architektury — 15. 9. 2025
**Téma:** Registrace firmy & členství (Sprint 2)  
**Rozhodnutí:** Zavedeme `CompanyMember` pro RBAC/membership (OWNER atd.). `User` zůstává štíhlý (auth). Kontaktní/fakturační údaje budou řešeny samostatným modulem **contacts/** a přes **invoices/Customer**. Připravíme migrační cestu `company_members.contact_id` (po zavedení contacts).  
**Důvod:** Čisté oddělení Auth vs. Business, soulad s modular-monolith by feature a RBAC 2.1, snížení reworku.  
**Dopady:** DB constraint „1 OWNER per company“, i18n klíče, rate-limit na public endpointu, bez autologinu (verifikace později).

## ✅ HOTOVO – 15. 9. 2025
- Schválen ADR: CompanyMember (MVP) + future Contacts/Customer.
- Upřesněna akceptační kritéria a test plan pro registraci firmy + OWNER.

## 🛠 TODO (Sprint 2/1 – BE)
- [ ] Flyway: `company_members` + unique owner per company, uniq `companies(ico)`, uniq `lower(users.email)`.
- [ ] Registrační služba: vytvořit Company, User (email+passwordHash+companyId), CompanyMember(OWNER).
- [ ] i18n: `company.exists`, `user.email.exists`, validační klíče (cs/en).
- [ ] MockMvc + @DataJpaTest: happy path, duplicity, unique OWNER, i18n.

## 🔭 FUTURE
- Contacts modul (Contact/Person + Address) a napojení `company_members.contact_id`.
- E-mail verifikace + autologin po potvrzení.
- Admin správa členů a rolí (team:* scopes).

## ✅ HOTOVO – 15. 9. 2025
- DB: unikátní index `lower(users.email)` a `companies(ico)`.
- DB: zavedena tabulka `company_members` + constraint „1 OWNER na firmu“.
- BE: `UserRepository` doplněn o `existsByEmailIgnoreCase` a `findByEmailIgnoreCase`.
- BE: `CompanyRepository` s `findByIco` a `existsByIco`.
- BE: přidána entita a repo `CompanyMember`.

## 🛠 TODO (Sprint 2/1 – registrace)
- [ ] Doplňit registrační službu: vytvoření `Company`, `User` (email+passwordHash+companyId), `CompanyMember(OWNER)`.
- [ ] Public endpoint `/api/v1/tenants/register` (permitAll + rate-limit).
- [ ] Integrační testy: happy path, duplicita IČO / e-mail, unikátní OWNER, i18n.

## ✅ HOTOVO – 16. 9. 2025
- BE registrace firmy: fungující endpoint `POST /api/v1/tenants/register` (public).
- Vytvoření Company, User (email+passwordHash+companyId), CompanyMember(OWNER).
- Opraven NPE: inicializace `Company.sidlo` před mapováním adresy.
- Ověřeno přes Swagger/cURL (201 Created).

## 🛠 TODO (Sprint 2/1 – BE)
- [ ] Dopsat integrační testy: 409 duplicitní IČO/e-mail, i18n, unique OWNER (DB).
- [ ] Omezit/odstranit DEV exception handler (detail DB chyb) mimo `local` profil.
- [ ] Nastavit rate-limit pro `/api/v1/tenants/register`.
- [ ] Swagger: doplnit `@Operation`, `@ApiResponse(409)` + example payloady.

## 🔭 FUTURE
- E-mail verifikace + autologin po potvrzení.
- Contacts modul (napojení na členy přes `contact_id`).

## 🛠 TODO – Sprint 2/2 (FE)
- [ ] FE Registration Wizard (3 kroky): ARES → náhled/edit → owner+submit.
- [ ] Validace (Zod): ico, company, address, owner, terms.
- [ ] API vrstva: `api/companies.aresLookup`, `api/tenants.registerTenant`.
- [ ] i18n cs/en (errors.*, validation.*, labels.*, steps.*).
- [ ] Error mapping: 409 company.exists/user.email.exists, 400 validation, 429 rate limit.
- [ ] UX: loading/disabled, retry, sessionStorage, a11y fokus.
- [ ] Testy: RTL (unit/integration) + e2e (happy/duplicitní scénáře).

## ✅ HOTOVO – 16. 9. 2025
- Schválen a připraven FE Step Plan pro registraci (3 kroky) vč. DTO, validací, i18n, UX a test plánu.

### 18. 9. 2025 — Team (Company Members) — BE skeleton
- **Přidáno:** TeamMembersController (POST/GET/PATCH/DELETE skeleton), DTO (`CreateMemberRequest`, `UpdateMemberRequest`, `MemberDto`, `MemberListResponse`), `TeamService` + `TeamServiceImpl` (stubs), `MemberMapper` (stub), WebMvcTest stub.
- **Security:** RBAC scopy a companyId guard **zatím ne** (půjde do PR 3/N).
- **i18n:** Seed klíče v `errors_cs/en`.
- **Swagger:** Tag `Team` + základní operace.
- **Dopad:** Bez DB změn; CI zelené.

## ✅ HOTOVO (19. 9. 2025)
- Zavedeno jednotné i18n API: `cz.stavbau.backend.common.i18n.Messages`.
- Zavedena hierarchie doménových výjimek: `DomainException`, `ConflictException`.
- Refactor `CompanyRegistrationServiceImpl` na `Messages` + `ConflictException`.
- Doplněny základní unit testy pro `Messages`.

## 📌 TODO
- Projít ostatní služby a nahradit lokální `msg()` + vnořené výjimky.
- Rozšířit `ApiExceptionHandler` o jednotné mapování všech `DomainException` s RFC7807.
- (Volitelné) Zavést `ErrorCode` enum a metodu `messages.msg(ErrorCode, args...)`.

## 💡 FUTURE
- Centralizovat validační kódy do `validation.properties` a sjednotit klíče napříč moduly.

### 19. 9. 2025 — Team (Company Members) — PR 2B (BE service)

- **Implementováno:** `TeamServiceImpl` (add/list/update/remove) + lokální helpery (normalizeEmail/validateEmail/requireTeamRole) + mapování **TeamRole→CompanyRoleName** (`ADMIN→COMPANY_ADMIN`, `MEMBER→VIEWER`).
- **Invite flow (MVP):** nový uživatel se zakládá se `state=INVITED`, `passwordNeedsReset=true`, `invitedAt=now()`, `passwordHash=BCrypt(random)`. `MemberDto.status` je odvozený (`INVITED|CREATED`).
- **Mapper:** `MemberMapper` čte jméno/telefon z `CompanyMember` (`firstName/lastName/phone`).
- **Guardy & konflikty:** 403 `errors.forbidden.company.mismatch` (companyId mismatch), 403 `errors.owner.last_owner_forbidden` (zákaz změny/odebrání OWNERa), 409 `member.exists`, 409 `user.assigned_to_other_company`, 404 `errors.not.found.member`.
- **i18n:** doplněno `errors.forbidden.company.mismatch` (cs/en) a `errors.validation.role.invalid`.
- **Security:** RBAC scopy `team:read|write` a controller guard na `{companyId}` budou řešené v **PR 3/N** (žádná změna `SecurityConfig` v tomto PR).
- **DB:** bez změn schématu; pokud chyběly sloupce `first_name/last_name/phone` u `company_members`, doplněn minor patch `V2025_09_19_002__company_member_contact_fields.sql`.
- **CI:** unit testy (invited flow, user v jiné firmě, OWNER guard) — **zelené**.

### 20. 9. 2025 — Sprint 2/1: Team (Company Members) — checkpoint

**Hotovo (BE)**
- PR 2A: Přidán stav uživatele a invite flagy  
  - `users.state (INVITED|ACTIVE|DISABLED|LOCKED)`, `users.password_needs_reset`, `users.invited_at`.
  - `User` rozšířen o nové fieldy; JPA smoke test OK.
- PR 2B: Implementována business logika TeamService  
  - `TeamServiceImpl` (add/list/update/remove), lokální helpery (normalizeEmail/validateEmail/requireTeamRole, generateRandomSecret).  
  - Mapování **TeamRole → CompanyRoleName** (`ADMIN→COMPANY_ADMIN`, `MEMBER→VIEWER`).  
  - Guardy a konflikty: `member.exists`, `user.assigned_to_other_company`, `errors.owner.last_owner_forbidden`, `errors.not.found.member`.  
  - `MemberMapper` čte `firstName/lastName/phone` z `CompanyMember`.  
  - (Pokud chybělo) mikro migrace `company_members.{first_name,last_name,phone}` doplněna.
- PR 3: Controller + RBAC + companyId guard  
  - `TeamMembersController` (POST/GET/PATCH/DELETE) + `@PreAuthorize` (`team:read|team:write`).  
  - `BuiltInRoles`: OWNER/COMPANY_ADMIN → read+write; VIEWER/AUDITOR_READONLY → read.  
  - Company guard: path `{companyId}` vs principal.companyId (přes `@AuthenticationPrincipal`).  
  - Swagger: sekce **Team** viditelná a běží.  
  - Drobné výjimky: `NotFoundException`, `ForbiddenException` doplněny.  
  - Oprava utilu/varianty pro `currentCompanyId()` (Optional nebo obalení v controlleru).

**Hotovo (i18n & errors)**
- Přidány/ujasněny klíče:  
  - `errors.forbidden.company.mismatch` (cs/en),  
  - `errors.validation.role.invalid`,  
  - re-use: `errors.member.exists`, `errors.user.assigned_to_other_company`, `errors.owner.last_owner_forbidden`, `errors.not.found.member`, `errors.validation.email`.

**Hotovo (FE příprava)**
- Vyjasněna integrace FE skeletonu (PR 4/N) bez duplicit: použít `lib/api/client.ts`, sdílené typy v `lib/api/types.ts`.  
- Připraven prompt pro nové vlákno: **PR 4/N — FE skeleton: Team** (route `/app/team`, TeamPage, TeamService nad existujícím klientem, i18n, msw, smoke test).

**Dopad na security**
- Aktivní scopy `team:read|team:write` + přiřazení k rolím v `BuiltInRoles`.  
- CompanyId guard na všech Team endpointech (403 při mismatch).  
- Rate-limit zatím **neaktivován** pro tyto endpointy (viz TODO).

---

**TODO (nejbližší)**
- **PR 3a:** zapnout rate-limit (např. 5/min) pro `POST /members` a `DELETE /members/{memberId}`; i18n `errors.rate.limit` + RFC7807 mapping na 429.
- **PR 4/N (FE skeleton):**  
  - Route `/app/team` s `ProtectedRoute` + `ScopeGuard(['team:read'])`.  
  - `TeamService` **nad** `lib/api/client.ts` (žádný nový Axios klient).  
  - Typy **do** `lib/api/types.ts` (TeamRole, MemberDto, MemberListResponse, Create/UpdateMemberRequest).  
  - `TeamPage` (tabulka, loading/empty/error).  
  - i18n `team.json` (cs/en) + připojení do initu.  
  - MSW handler GET (prázdný seznam) + smoke test.
- **PR 5/N (FE actions):** Add member (modal), Change role, Remove (confirm), error mapping (RFC7807→i18n), MSW pro POST/PATCH/DELETE, testy (unit + msw).
- **PR 6/N (E2E):** základní e2e scénář (login → /app/team → add → change role → remove), CI job.

**Future (po MVP)**
- Invite e-mail flow: invitation token + expirace, resend, aktivace účtu (endpoint), audit.  
- Paging/sorting pro `GET /members` + filtr role.  
- Konsolidace ProblemDetails (stálý `code` na BE, sdílený FE mapper).  
- Audit log rozšířit (structured logging, korelace, metriky).  
- Přechod na **contacts/**: `company_members.contact_id` + přesun osobních údajů (zpětně kompatibilní mapper).  
- Rozšíření RBAC (jemné scopy `team:add|remove|update_role` pro PRO tarif).  
- Swagger: doplnit příklady request/response (201/409/403/404/429) a kódy chyb.


