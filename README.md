# 🏗️ STAVBAU-V2

STAVBAU-V2 je backend + frontend projekt vyvíjený jako **modular monolith**.  
Cílem je vytvořit udržitelnou, profesionální a rozšiřitelnou SaaS platformu pro řízení stavebních projektů.

---

## 📂 Struktura projektu
- **Backend (Spring Boot 3, Java 17+)** – modular monolith by feature, DDD přístup.  
- **Frontend (React + Vite + TypeScript)** – modulární, s vlastním UI kitem (`stavbau-ui`).  
- **Databáze (PostgreSQL, Flyway)** – řízené migrace, JSONB podpora.  
- **Docker Compose** – lokální prostředí (DB + pgAdmin).  

---

## 📖 Dokumentace

Veškerá projektová dokumentace se nachází ve složce [`/docs`](./docs):

- [STAVBAU_GUIDELINES.md](./docs/STAVBAU_GUIDELINES.md) – hlavní pravidla, workflow, governance, mindset, checklist  
- [REPO_GUIDELINES.md](./docs/REPO_GUIDELINES.md) – pravidla pro GitHub (PR/CI/labels/CODEOWNERS, governance)  
- [STAVBAU_TEMPLATES.md](./docs/STAVBAU_TEMPLATES.md) – šablony Commit + Step Plan  
- [bussines plan.md](./docs/bussines%20plan.md) – směr, monetizace, cílovky, strategie  
- [Sprintový plán – MVP verze STAVBAU.md](./docs/Sprintový%20plán%20–%20MVP%20verze%20STAVBAU.md) – aktuální sprinty  
- [struktury projektu (balíčky & vrstvy) - včetně i18n.md](./docs/struktury%20projektu%20(balíčky%20&%20vrstvy)%20-%20včetně%20i18n.md)  
- [modular monolith (by feature).md](./docs/modular%20monolith%20(by%20feature).md)  
- [hotovo-todo-future.md](./docs/hotovo-todo-future.md) – časová osa (hotovo / todo / future)  
- [PROJECT_SETUP.md](./docs/PROJECT_SETUP.md) – postup nastavení projektu + první prompt

---

## 🚀 Vývoj
Vývoj se **řídí pravidly v [`STAVBAU_GUIDELINES.md`](./docs/STAVBAU_GUIDELINES.md)**.  

- Každý commit musí následovat **Conventional Commits**.  
- Každý větší krok musí začínat analýzou pomocí **Step Plan**.  
- Po dokončení bloku práce se provádí checkpoint → aktualizace `hotovo-todo-future.md`.  

---
## 📜 Licence
Projekt zatím není veřejně licencován – licence bude doplněna podle zvoleného modelu distribuce (MVP vs PRO verze).  

![FE CI](https://github.com/preisvladimir/stavbau-frontend-v2/actions/workflows/frontend-ci.yml/badge.svg)
