# 📂 PROJECT_SETUP.md

## 1. Nahrané soubory (do `/docs`)
Na začátku projektu STAVBAU-V2 vždy nahraj tyto soubory:  
- `STAVBAU_GUIDELINES.md` – hlavní pravidla, workflow, governance, mindset, checklist  
- `REPO_GUIDELINES.md` – pravidla pro GitHub (PR/CI/labels/CODEOWNERS, governance)  
- `STAVBAU_TEMPLATES.md` – šablony Commit + Step Plan  
- `bussines plan.md` – směr, monetizace, cílovky, strategie  
- `Sprintový plán – MVP verze STAVBAU.md` – aktuální sprinty  
- `struktury projektu (balíčky & vrstvy) - včetně i18n.md`  
- `modular monolith (by feature).md`  
- `hotovo-todo-future.md` – časová osa (hotovo / todo / future)  

👉 Tyto dokumenty slouží jako **zdroje pravdy**.  

---

## 2. Pokyny projektu (nastavení v ChatGPT)

> **Pokyny pro ChatGPT (STAVBAU-V2):**  
> - Vždy používej nahrané dokumenty jako **zdroj pravdy**.  
> - Pokud nastane konflikt mezi dokumenty nebo nejasnost, upozorni mě a navrhni řešení.  
> - Neprogramuj dopředu – vždy navrhni **Step Plan** a ověř, než napíše kód.  
> - Každý dokončený krok musí mít zápis do `hotovo-todo-future.md`.  
> - Vždy dbej na konzistenci s `STAVBAU_GUIDELINES.md` a `REPO_GUIDELINES.md`.  
> - Pracuj profesionálně, s ohledem na budoucnost (škálovatelnost, modularita, analýza trhu).  
> - Připomínej commitování, checkpointy a aktualizace sprintu.  
> - Pokud navrhnu něco, co už je hotovo, upozorni mě s odkazem na `hotovo-todo-future.md`.  
> - Aktivně používej příkazy GitHub CLI, PR šablony a governance z `REPO_GUIDELINES.md`.  
> - **Aktivně kontroluj a nahlížej do aktuálního kódu v GitHub repozitářích** (backend a frontend).  
>   - Pokud navrhuji změnu, ověř si, zda už kód existuje nebo je řešen jinak.  
>   - Pokud hrozí duplicita, upozorni mě a odkazuj na konkrétní soubor/část kódu.  

---

# 🚀 První prompt pro nový projekt chat STAVBAU-V2

```
Máme připravený projekt STAVBAU-V2.  
Nahrál jsem všechny dokumenty do /docs a nastavil pokyny projektu podle PROJECT_SETUP.md.  

Začneme Sprint 1: Inicializace projektu.  
Potřebuji od tebe detailní Step Plan pro první kroky (BE i FE), v návaznosti na sprintový plán a guidelines.  
Nechci ještě psát kód – nejdřív rozplánujeme cíle, závislosti, dopady na architekturu a akceptační kritéria.
```
