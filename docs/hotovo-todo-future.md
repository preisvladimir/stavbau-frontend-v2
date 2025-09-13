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


------------------------------------------------------------------------

## 📋 TODO (krátkodobé)

-   Definice **uživatelských rolí (RBAC)** a mapování na scopes.\
-   **Company → User vztah** rozšířit o role v rámci firmy.\
-   Přidat testy pro rate-limiting (ověření blokace při překročení
    limitů).\
-   Doplnit CI/CD pipeline (GitHub Actions nebo GitLab CI).\
-   Připravit **Sprint 2**: první business funkce (projekty).
-   Cache (per lat,lon,date), rate-limit profil, RBAC scope `diary:write`.
-   Fallback provider + robustnější klasifikace COCO → label.
-   Unit/IT testy + metriky (latence, hit/miss cache).
- 

- **Backend**
  - Zapnout **Branch protection** na `main` a vyžadovat passing checks.
  - Po prvním zeleném běhu CI otagovat `v0.1.0` (navazuje na `CHANGELOG.md`).

- **Frontend**
  - Inicializovat projekt: Vite React TS skeleton (`create-vite@7.1.1`), `npm install`, první commit.
  - Přidat alias `@ -> src` a přísnější TS pravidla (`tsconfig.json`, `vite.config.ts`).
  - Přidat router (`react-router-dom`), `AuthContext`, `AuthGuard`, `axios` instance (kostra).
  - Zkopírovat `/docs` (GUIDELINES, TEMPLATES, hotovo‑todo‑future) – FE může mít vlastní časovou osu.
  - Přidat `frontend-ci.yml` a CI badge do `README.md`.
  - Zapnout **Branch protection** na `main`.
------------------------------------------------------------------------

## 🔮 FUTURE (střednědobé)
- **Dependabot** pro Maven a npm (bezpečnostní updaty).
- `CODEOWNERS` pro klíčové oblasti (security, migrace, FE auth/router).
- Automatizace releasů (GitHub Releases s artefakty JAR/dist).
- Přidat `Issues` štítky a šablony (bug report, feature request).

## 🔮 FUTURE

-   Přechod na **distributed cache (Redis)** pro rate-limit a refresh
    tokeny.\
-   Podpora **multi-tenantingu** (více firem v rámci jedné DB).\
-   Integrace **externích API** (ARES, ČÚZK).\
-   Připravit základní **frontend skeleton** (React + stavbau-ui).
