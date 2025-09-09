# 📝 STAVBAU_TEMPLATES.md

## 1. Šablona pro commit message (Conventional Commits)

```text
<type>(<scope>): krátký popis změny

[volitelně delší popis změny a důvod]

BREAKING CHANGE: [pokud změna není zpětně kompatibilní]

# Typy:
feat     – nová funkčnost (pro uživatele nebo systém)
fix      – oprava chyby
refactor – úprava kódu bez změny chování
docs     – dokumentace (README, Javadoc…)
test     – přidání/úprava testů
chore    – údržba, build skripty, závislosti
ci       – změny v CI/CD pipeline
```

**Příklad:**
```
feat(auth): přidán refresh token s rotací jti
```

---

## 2. Šablona pro Step Plan

```markdown
### Step Plan – [název kroku]

**Cíl:**
- (čeho chceme dosáhnout, jaká funkčnost bude hotová)

**Vstupy / závislosti:**
- (co už je hotovo a na čem stavíme)
- (co musí být připraveno – DB migrace, FE komponenta, …)

**Změněné části:**
- Backend: (entity, repo, service, controller)
- Frontend: (komponenty, stránky, hooks)
- Databáze: (nové tabulky/sloupce/migrace)
- Bezpečnost / i18n: (role, scopes, lokalizace)

**Akceptační kritéria:**
- (co musí být otestováno, aby bylo jasné, že krok je dokončen)

**Test Plan:**
- (postup testování – Postman / FE klikací scénář / unit testy)

**Rollback:**
- (jak krok revertovat, pokud by selhal)
```
