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


------------------------------------------------------------------------

## 📋 TODO (krátkodobé)

-   Definice **uživatelských rolí (RBAC)** a mapování na scopes.\
-   **Company → User vztah** rozšířit o role v rámci firmy.\
-   Přidat testy pro rate-limiting (ověření blokace při překročení
    limitů).\
-   Doplnit CI/CD pipeline (GitHub Actions nebo GitLab CI).\
-   Připravit **Sprint 2**: první business funkce (projekty).


- **Backend**
  - Commitnout `.gitattributes` a `.editorconfig` do `stavbau-backend-v2`.
  - Přidat CI badge do `README.md`.
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
