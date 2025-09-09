# 📂 REPO_GUIDELINES.md

Pravidla pro správu GitHub repozitářů projektu **STAVBAU-V2**.  
Dodržování těchto pravidel je povinné pro všechny commity, PR a správu repozitářů.

---

## 0. Repozitáře
- **Backend:** https://github.com/preisvladimir/stavbau-backend-v2  
- **Frontend:** https://github.com/preisvladimir/stavbau-frontend-v2  
- **Actions backend:** https://github.com/preisvladimir/stavbau-backend-v2/actions  
- **Actions frontend:** https://github.com/preisvladimir/stavbau-frontend-v2/actions  

---

## 1. Branching & Branch protection
- **Hlavní větev:** `main` – chráněná.
- **Feature branches:** `feat/...`, `fix/...`, `chore/...`, `ci/...`, `docs/...`.
- **Pravidla pro `main`:**
  - Require Pull Request (žádný přímý push).
  - Min. 1 review approval.
  - Povinné status checks (CI backend / frontend).
  - Resolve all conversations před merge.
  - Branch up-to-date s `main`.
  - Force push a mazání zakázáno.

---

## 2. Pull Request (PR) pravidla
- Každá změna jde přes PR.
- Název PR ve stylu Conventional Commits (`feat:`, `fix:`, `chore:`...).
- Tělo PR musí obsahovat:
  - **Co se mění**.
  - **Proč se mění**.
  - **Dopad** (na BE/FE/DB/i18n/security).
  - Odkaz na sprint nebo issue.
- PR šablona (`.github/PULL_REQUEST_TEMPLATE.md`) je povinná.
- PR se merguje pomocí **Squash & Merge** (čistá historie).
- Automaticky mazat větev po merge.

---

## 3. Reviews
- Min. 1 schvalující review (u bootstrap PR lze dočasně vypnout).
- Doporučeno **Dismiss stale reviews** při novém commitu do PR.
- Pokud změna spadá pod **CODEOWNERS**, review od příslušného vlastníka je povinné.

---

## 4. Continuous Integration (CI)
- Každý PR musí projít CI:
  - **Backend:** `backend-ci.yml` (Java 17, Maven, build + test + artifact).
  - **Frontend:** `frontend-ci.yml` (Node, pnpm, lint + test + build).
- Badge s CI stavem je v README každého repozitáře.
- Mergovat lze jen po úspěšném CI.

---

## 5. Labels (štítky)
Používat jednotný set štítků pro Issues a PR:
- `bug`, `fix`, `enhancement`, `feature`
- `security`
- `documentation`
- `performance`
- `test`
- `priority-high`, `priority-medium`, `priority-low`
- `sprint-1`, `sprint-2`, ...
- `good first issue`
- `question`, `wontfix`

Přiřazení štítků probíhá při tvorbě issue/PR.

---

## 6. CODEOWNERS
- Soubor `.github/CODEOWNERS` definuje vlastníky klíčových částí kódu.
- Změny v těchto souborech vyžadují review od příslušného vlastníka.

---

## 7. Releases & Changelog
- Používat **semver** (`vMAJOR.MINOR.PATCH`).
- Po mergi do `main` vytvořit **tag** a GitHub Release.
- Release obsahuje changelog a (pokud dává smysl) artefakty (např. JAR).
- `CHANGELOG.md` se aktualizuje při každém PR (sekce Unreleased → verze).

---

## 8. Secrets
- Nikdy necommitovat tajemství ani klíče.
- Backend: konfigurace přes `application.yml` + ENV.
- Frontend: pouze `VITE_*` proměnné v `.env` (bez reálných hodnot v gitu).
- Používat GitHub **Actions Secrets** pro CI.

---

## 9. Governance & best practices
- **Conventional Commits** pro názvy commitů.
- **Small PRs** – max. ~200 řádků, raději více menších než jeden velký.
- Každý merge musí doplnit checkpoint do `hotovo-todo-future.md`.
- Architektura: vždy respektovat `struktury projektu` a `modular monolith`.
- Issues → musí mít štítek a být navázané na sprint.

---

## 10. GitHub CLI (aktivní využívání)
Používat GitHub CLI (`gh`) pro běžné operace:

### Autentizace
```bash
gh auth login
gh auth status
```

### Pull Requesty
```bash
gh pr create --title "feat: ..." --body "Popis změny"
gh pr checkout <id>
gh pr review <id> --approve
gh pr merge <id> --squash --delete-branch
```

### Issues
```bash
gh issue create --title "Bug: ..." --body "Popis bugu" --label bug
gh issue list
gh issue status
```

### Releases
```bash
gh release create v0.1.0 --notes "První release"
```

Používat CLI je rychlejší, konzistentní a umožňuje automatizaci.

---
