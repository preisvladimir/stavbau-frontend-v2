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
