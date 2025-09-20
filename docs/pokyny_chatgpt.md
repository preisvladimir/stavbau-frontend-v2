# Pokyny pro ChatGPT (STAVBAU‑V2)

> **Cíl:** Jasně definovat způsob práce ChatGPT v rámci projektu STAVBAU‑V2 tak, aby výstupy byly konzistentní, ověřené a v souladu s projektovými pravidly.

---

## 1) Zdroj pravdy – dokumentace
**Primární zdroj:** `https://github.com/preisvladimir/stavbau-backend-v2/tree/main/docs` (větev `main`).

**Pravidla:**
- Vždy vycházej z **aktuálního obsahu** tohoto adresáře.
- Při citaci uveď **název souboru** a pokud lze, **commit SHA** (případně odkaz na konkrétní řádky).
- Když je repozitář nedostupný nebo obsah chybí, **informuj zadavatele a nepokračuj bez potvrzení**.


## 2) Pořadí autority (při konfliktu)
1. Obsah v `/docs` na `main` (aktuální stav)  
2. `REPO_GUIDELINES.md` (governance, PR procesy, CI/CD)  
3. `STAVBAU_GUIDELINES.md` (doménové zásady, styl)  
4. Ostatní dokumenty v `/docs` (sprint, TODO, architektura apod.)  
5. To, co vyplývá z **aktuálního kódu** (backend + frontend)

> Pokud si dokumenty odporují, **upozorni** na konflikt a **navrhni řešení** s citacemi/odkazy.


## 3) Standardní workflow odpovědi
1. **Step Plan** – navrhni stručné kroky (1–N), co a v jakém pořadí uděláme.  
2. **Ověření v repu** – před implementací zkontroluj, zda řešení už neexistuje (backend i frontend). Uveď **konkrétní soubory/řádky**.  
3. **Návrh řešení** – krátký technický návrh v souladu s dokumenty a architekturou (modular monolith by feature).  
4. **Implementace** – až po schválení *Step Planu*. Kód piš modulárně, škálovatelně, s ohledem na testy a bezpečnost.  
5. **Kontroly** – lint, testy, bezpečnost, konzistence s `REPO_GUIDELINES.md` a `STAVBAU_GUIDELINES.md`.  
6. **PR návrh** – název, popis, checklist, odkazy na soubory/řádky a související issue.


## 4) Evidence práce
- Po **dokončení každého kroku** aktualizuj `docs/hotovo-todo-future.md` (sekce **HOTOVO / TODO / FUTURE** + datum).  
- Připomínej **commitování**, **checkpointy** (tagy/sprinty) a aktualizaci sprint plánu.


## 5) Práce s repozitáři (aktivní kontrola kódu)
- Aktivně nahlížej do **backend** i **frontend** repozitářů.  
- Pokud hrozí duplicita, **upozorni** a přilož **přesný odkaz** (soubor, řádky).  
- U změn navrhni **umístění** (balíček/vrstva) dle projektové struktury a zásad **modular monolith (by feature)**.


## 6) Komunikace
- Odpovídej **česky**, pokud není výslovně požádáno jinak.  
- **Neprogramuj naslepo** – bez ověření a bez schváleného *Step Planu* nedodávej hotový kód.  
- Při nejasnosti přiznej **nejistotu**, navrhni 1–2 varianty a uveď, **co je potřeba ověřit**.


## 7) Kvalita a budoucnost
- Preferuj řešení **udržitelná, škálovatelná, modulární**.  
- Dbej na **testovatelnost**, **bezpečnost**, **observabilitu** (logování/metry/tracing) a **DX**.  
- Respektuj návrhové vzory a principy (SOLID, čistá architektura, explicitní hranice modulů).


## 8) Git/PR proces (REPO_GUIDELINES)
- Dodržuj **pojmenování větví**, šablony PR a governance.  
- Navrhuj smysluplné **commit messages** a **tagy**; v PR uváděj **související issue** a dopad změny.  
- V PR uveď **jak testovat** a **rizika** (včetně rollback plánu, pokud dává smysl).


## 9) Když navrhnu něco, co už existuje
- **Upozorni** na existující implementaci a odkaž na **konkrétní soubor/oddíl** nebo na `docs/hotovo-todo-future.md`.


## 10) Operativní zásady
- **Nepřepisuj** existující rozhodnutí bez zdůvodnění; zohledni dopad na ostatní moduly.  
- **Citace** a odkazy piš tak, aby byly znovupoužitelné (soubor + SHA/řádky).  
- Pokud je potřeba data/kontext mimo `/docs`, **explicitně si vyžádej zdroj**.


---

> **Poznámka:** Tento dokument je závazný pro veškerou spolupráci s ChatGPT v rámci projektu STAVBAU‑V2. Aktualizace prováděj přes PR se stručným changelogem v popisu.

