## 🗓️ Sprintový plán – MVP verze STAVBAU

Týdenní sprinty pro vývoj funkčního MVP (8 týdnů).
Každý sprint má jasně vymezené cíle, prioritní úkoly a výstupy.

---

### 🚀 Sprint 1: Inicializace projektu

* Vytvoření repozitáře a základní struktury (BE)
* Konfigurace `pom.xml` + závislosti
* `application.yml`, PostgreSQL, Docker Compose
* `StavbauBackendApplication.java` + test HelloWorld endpoint

**Výstup:** Backend aplikace spustitelný lokálně s připraveným DB připojením

---

### 🔐 Sprint 2: Autentizace a uživatelé

* Entita `User` + `Role` enum
* `UserRepository`, `UserController`, DTO vrstvy
* `PasswordEncoder` + hashování hesla
* JWT login (`AuthController`, `JwtService`)
* JWT validace (`JwtAuthenticationFilter`, `SecurityConfig`)

**Výstup:** Možnost přihlásit uživatele a získat JWT token

---

### 🏗️ Sprint 3: Projekty a členové

* Entita `Project`, `ProjectMember`
* CRUD endpointy pro projekty
* Přidávání členů do projektů
* Kontrola oprávnění dle role (OWNER, MEMBER)

**Výstup:** Plná správa projektů včetně přiřazení uživatelů

---

### 📒 Sprint 4: Stavební deník

* Entita `LogEntry`, `LogEntryFile`
* CRUD zápisy do deníku
* Možnost přidání fotografií (souborový systém)
* Export zápisu do PDF (základní šablona)

**Výstup:** Funkční deník včetně zápisu, přiložených souborů a exportu

---

### ✅ Sprint 5: Úkoly a To-Do list

* Entita `Task`
* CRUD endpointy pro úkoly
* Filtrace podle projektu, uživatele, stavu
* Přepínání stavu (hotovo / nehotovo)

**Výstup:** Základní task management propojený s projekty

---

### 🧮 Sprint 6: Rozpočet

* Entita `BudgetItem`
* CRUD operace nad položkami
* Výpočty (qty × unit price = total)
* Kategorizace + validace dat

**Výstup:** Rozpočtová tabulka propojená s projektem

---

### 📎 Sprint 7: Správa souborů a tým

* Nahrávání dokumentů (PDF, DWG, obrázky)
* Organizace dle projektu a složky
* Seznam členů týmu + jejich oprávnění
* Endpointy pro přidání / odebrání člena

**Výstup:** Možnost spravovat dokumenty a členy týmu v rámci projektu

---

### 🧪 Sprint 8: Stabilizace a testování

* Globální error handler (`@ControllerAdvice`)
* Testy: `@DataJpaTest`, `@WebMvcTest`
* Kontrola bezpečnosti endpointů
* API dokumentace (Swagger / springdoc-openapi)
* Připravit na pilotní testování

**Výstup:** Kompletní MVP připraveno pro test ve 3–5 reálných firmách
