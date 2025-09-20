# 📑 STAVBAU_GUIDELINES.md

Hlavní referenční dokument pro projekt **STAVBAU‑V2**.  
Obsahuje pravidla práce, návaznost na dokumenty, GitHub governance, workflow, definice hotovo, mindset i operativní checklist.  
Slouží jako **jediný zdroj pravdy** pro postup v projektu.

---

## 1. Úvod a základní pravidlo
- Vždy se při práci opírat o nahrané referenční dokumenty (`/docs`).  
- Nepsat nic, co by bylo v rozporu s těmito zdroji. Pokud nastane konflikt, upozornit na něj a doporučit řešení (sloučení, oprava, doplnění).  
- Cílem je **profesionální, udržovatelný a dlouhodobě rozšiřitelný systém**.

---

## 2. Dokumenty a jejich účel
- **`bussines plan.md`**  
  🔹 Hlavní referenční dokument pro business plán, cílové skupiny, monetizaci, konkurenci a strategii rozvoje.  
  ➝ Používat při úvahách o směru vývoje, marketingu a monetizaci.

- **`Sprintový plán – MVP verze STAVBAU.md`**  
  🔹 Rozpad práce do sprintů, definice kroků a priorit pro MVP.  
  ➝ Každý nový úkol musí být navázán na tento plán. Pokud vznikne práce mimo plán, doporučit její zařazení.

- **`struktury projektu (balíčky & vrstvy) - včetně i18n`** a **`modular monolith (by feature).md`**  
  🔹 Referenční dokumenty pro architekturu backendu (Spring Boot, modular monolith, DDD by feature, i18n).  
  ➝ Každý nový kód, návrh entity, API nebo FE struktury musí být konzistentní s těmito strukturami.  
  ➝ Pokud něco chybí, doporučit rozšíření dokumentu, ne tvořit ad-hoc řešení.

- **`hotovo-todo-future.md`**  
  🔹 Jediný zdroj pravdy o tom, co už je hotovo, co je TODO a co je v plánu (future).  
  ➝ Nikdy nenavrhovat refaktorování něčeho, co je už hotové, pokud není důvod (např. bug, změna požadavků).  
  ➝ Každý dokončený úkol ihned zaznamenat (shrnutí v chatu + doplnění do souboru).  
  ➝ Pokud navrhnu něco, co už bylo hotové, upozorni mě a odkaž se na tento dokument.

- **`STAVBAU_TEMPLATES.md`**  
  🔹 Šablony pro Commit message a Step Plan.  
  ➝ Používat při každém commitu a návrhu nového kroku.

- **`REPO_GUIDELINES.md`**  
  🔹 Pravidla pro GitHub (PR/CI/labels/CODEOWNERS, governance).  
  ➝ Dodržovat při správě repozitářů.

- **`RBAC_2.1_STAVBAU_V2.md`**  
  🔹 Doménový návrh řízení přístupu (Company roles, Project roles, Scopes).  
  ➝ Používat při implementaci bezpečnostních kontrol, JWT payloadu, FE togglů a BE autorizace.  
  ➝ Každá změna RBAC musí být provedena skrz tento dokument (PR + update), aby zůstal jediným zdrojem pravdy.
---

## 3. Průběh práce (workflow)
1. **Před implementací** vždy vytvořit krátký **Step Plan**:  
   - Cíl, vstupy/závislosti, změněné části (BE/FE/DB), migrace, bezpečnost & i18n dopady, akceptační kritéria, test plan, rollback.  

2. **Inkrementální vývoj** – nekódujeme dopředu, jen minimální další krok. Pokud je nejasnost → zeptat se.  

3. **Minimalizovat rework** – vždy hlídat, abychom nepřepisovali hotové části bez vážného důvodu.  

4. **Jasně rozlišovat roviny** – business (plán), sprint (MVP kroky), architektura (struktury, modular monolith), stav (hotovo-todo-future). 

5. **Commity (Conventional Commits)**  
   - po uzavřené jednotce práce (endpoint, služba, komponenta) nebo po 45–60 min.  
   - styl: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `build:`, `ci:`.  

6. **Pull Request povinný** (i když je autor stejný):  
   - 1 review (u bootstrapu lze dočasně vypnout).  
   - CI musí být zelené.  
   - PR popsat: co, proč, dopady, odkaz na sprint.  

7. **Doplňovat časovou osu** – pokud se něco udělá, hned vytvořit checkpoint do `hotovo-todo-future.md`.

8. **Checkpoint po mergi** – ihned doplnit `hotovo-todo-future.md` (datum, rozsah, moduly, důvod/dopad).  

9. **Aktualizace sprintu** – pokud změna rozšíří nebo zúží scope, upravit `Sprintový plán`.  

---

## 4. GitHub governance
- **Branch protection (main):**  
  - Require PR, approvals = 1, status checks, up-to-date branch, resolve conversations, no bypass.  
- **CI povinné:**  
  - BE: `backend-ci.yml` (build+test+artifact).  
  - FE: `frontend-ci.yml` (install+lint+test+build+artifact).  
- **Labels (štítky):** bug, enhancement, security, documentation, performance, test, good first issue, priority-{high|medium|low}, sprint-{1|2|3}, question, wontfix.  
- **Šablony:** ISSUE (bug, feature), PR template, CODEOWNERS.  
- **Changelog & verze:** semver, tag po zeleném CI, release s artefakty.  
- **Line endings & formát:** `.gitattributes` (LF), `.editorconfig`, lint/format na FE.  
- **Tajemství:** nikdy v repu; BE přes `application.yml` (env), FE jen `VITE_*` v `.env` (bez reálných hodnot).  

---

## 5. Definice hotovo (DoD)
- Splněná akceptační kritéria ze Step Planu.  
- CI zelené, build/lint/testy OK.  
- Dokumentace doplněna (`hotovo-todo-future.md`, sprint).  
- Žádné blokující TODO v kódu.  
- Zohledněny dopady na i18n a security.  

---

## 6. Chování a mindset
- **Profesionalita:** čistý a udržovatelný kód, dokumentace, SOLID/DDD.  
- **Budoucnost:** žádné hacky, škálovatelnost, připravenost na rozšíření.  
- **Analýza trhu:** pravidelně validovat směr vývoje, hledat příležitosti a rizika.  
- **Zodpovědnost:** kód zapadá do architektury, žádné přepisování hotového bez důvodu.  
- **Transparentnost:** každý krok musí být srozumitelný i zpětně.  

---

## 7. Použití šablon
- Každý commit a krok → použít šablony z `STAVBAU_TEMPLATES.md`.  
- Commity podle Conventional Commits.  
- Každý větší krok začít analýzou přes Step Plan.  

---

## 8. Startovní pořadí
**Backend:**  
1. Zaškrtnout required status check po prvním zeleném CI.  
2. Přidat CI badge do README.  
3. Vytvořit tag `v0.1.0` a release s JAR artefaktem.  

**Frontend:**  
1. Vite React TS init (`create-vite@7.1.1`) → první commit + CI.  
2. Alias `@→src`, TS strict, router + AuthContext, AuthGuard, axios instance.  
3. (Volitelné) Tailwind + základní `stavbau-ui` komponenty.  
4. `/docs` přiložit.  
5. CI badge v README.  

---

## 9. Rizikové vlajky (kdy brzdit)
- PR > 200 řádků bez rozdělení.  
- Chybí Step Plan.  
- Nesoulad s architekturou (struktury, modular monolith).  
- Nejasný směr vůči business plánu.  

---

## 10. Operativní checklist
- [ ] Backend: dokončit PR #1 → zaškrtnout required check → přidat CI badge → tag `v0.1.0`.  
- [ ] Frontend: init skeleton + PR → po CI zaškrtnout required check → přidat CI badge.  
- [ ] Checkpoint do `hotovo-todo-future.md` („Repo governance + CI + labels zavedeno“).  
- [ ] Issues pro Sprint 1:  
   - BE: RBAC základ.  
   - FE: login page + `/auth/me` + refresh flow.  

---

## 11. Konvence ID (API & doména)

- **Primární klíč všech entit** dědících z `BaseEntity` je `id: UUID`.  
- **API response DTO** musí používat `id` pro primární klíč resource (nikoli `userId`, `projectId`, …).  
- **Cizí klíče** v DTO pojmenovávej jako `<name>Id` (např. `companyId`, `projectId`).  
- **JWT**: `sub` (string UUID) = user id, `cid` = company id; RBAC claimy beze změny.  
- **Create/Update request DTO** primární `id` neobsahují (server generuje).  
- **URL**: `/users/{id}`, `/projects/{id}`, … – odpověď obsahuje `id`.  
- Důvod: konzistence, snadná normalizace FE store, žádné budoucí migrace názvů polí.  