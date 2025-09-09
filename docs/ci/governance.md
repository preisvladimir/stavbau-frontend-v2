# CI & Governance (MVP)

## Branch model
- `main` (stabilní), `develop` (integrace), `feature/*` (inkrementy).

## PR pravidla
- Povinná šablona: popis změny, test plan, breaking changes, checklist.
- Zelená CI je **required** pro merge do `develop` i `main`.

## Required checks
- BE: build + test.
- FE: build + typecheck + lint.

## CODEOWNERS
- Minimálně: core BE, core FE, docs. (Viz `codeowners.md`)

## Konvence
- Commity: konvenční zprávy (např. `feat:`, `fix:`, `docs:`).
- Každá změna API → update v `/docs/api-contracts`.
