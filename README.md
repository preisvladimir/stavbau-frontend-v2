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

## 📑 Dokumentace
Všechny referenční dokumenty a pokyny jsou uloženy ve složce [`/docs`](./docs):  
- `STAVBAU_GUIDELINES.md` – pravidla vývoje a používání dokumentů.  
- `STAVBAU_TEMPLATES.md` – šablony pro commit messages a Step Plan.  
- `hotovo-todo-future.md` – přehled HOTOVO / TODO / FUTURE (časová osa vývoje).  
- `bussines plan.md` – business plán projektu.  
- `Sprintový plán – MVP verze STAVBAU.md` – sprintový plán pro MVP.  
- `struktury projektu (balíčky & vrstvy) - včetně i18n.md` – návrh balíčků a vrstev.  
- `modular monolith (by feature).md` – architektura backendu.  

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
