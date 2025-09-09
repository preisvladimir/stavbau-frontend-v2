# Architecture Overview (MVP)

## Principy
- **Modular monolith (by feature)** – samostatné domény (users, auth, projects, …).
- Škálovatelnost: možnost pozdější extrakce do služeb bez velkých refaktorů.
- Jasné hranice modulů a kontraktů (API contracts v `/docs/api-contracts`).

## Backend (Spring Boot)
- JDK 17+, Spring Security 6, PostgreSQL, Docker Compose.
- Packages by feature: `cz.stavbau.backend.<feature>`.
- Config per prostředí: `application-*.yml`.

## Frontend (v2)
- Moduly v `modules/*`, API vrstva `lib/api`, UI kit `components/ui/stavbau-ui`.
- Připravená kotva pro i18n (viz `i18n-basics.md`).

## Integrace & Flow
- FE ↔ BE přes REST; Auth: Bearer JWT.
- Error handling sjednocen (viz `../api-contracts/common-errors.md`).

## Návaznost na budoucí PRO
- RBAC (role + scopes) rozšiřitelné bez přepisu FE.
- Multitenancy/Marketplace jako nové moduly.
