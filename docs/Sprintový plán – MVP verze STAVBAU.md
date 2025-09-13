## 🗓️ Sprintový plán – MVP verze STAVBAU

Týdenní sprinty pro vývoj funkčního MVP (11 týdnů).
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
* RBAC základ (company role → scopes, JWT claims, `/auth/me`)  

**Výstup:** Možnost přihlásit uživatele a získat JWT token  

---

### 🌍 Sprint 3: Integrace základních služeb (Geo, Weather, ARES)

* Dokončení **Geo modulu** (Mapy.cz API – suggest, reverse geocoding)  
* Dokončení **Weather modulu** (Meteostat – počasí k deníku, caching, fallback provider)  
* Rozšíření **ARES modulu** (lookup firmy podle IČO, validace, import údajů)  
* Scopes: `geo:read`, `weather:read`, `ares:read`  
* FE: autocomplete adres + počasí k vybranému dni  

**Výstup:** Integrované služby (adresy, počasí, firmy) dostupné v API i FE  

---

### 💰 Sprint 4: Finance a dokumentace (Invoices & Files)

* Implementace **Invoices** (Invoice, InvoiceLine, PDF export, číselné řady)  
* Implementace **Files** (upload, download, metadata, štítky)  
* Propojení faktur s ARES (automatické doplnění údajů odběratele)  
* Scopes: `invoices:*`, `files:*`  
* FE: demo fakturační modul + upload souborů  

**Výstup:** Fakturační modul + správa souborů připravené pro první firmy  

---

### 🔔 Sprint 5: Chytré funkce a notifikace

* Implementace **notifikací (SSE)** – nové faktury, soubory, počasí  
* AI modul (základní skeleton) – klasifikace fotek (např. detekce osob, OOPP)  
* FE hook `useNotifications()` + realtime zobrazení v navbaru  
* Offline cache (PWA skeleton) pro deník (CRUD offline, sync po připojení)  
* DB: `notifications` tabulka per user  

**Výstup:** Real-time notifikace a offline režim jako konkurenční výhoda  

---

### 🏗️ Sprint 6: Projekty a členové

* Entita `Project`, `ProjectMember`  
* CRUD endpointy pro projekty  
* Přidávání členů do projektů  
* Kontrola oprávnění dle role (OWNER, MEMBER)  

**Výstup:** Plná správa projektů včetně přiřazení uživatelů  

---

### 📒 Sprint 7: Stavební deník

* Entita `LogEntry`, `LogEntryFile`  
* CRUD zápisy do deníku  
* Možnost přidání fotografií (souborový systém)  
* Export zápisu do PDF (základní šablona)  

**Výstup:** Funkční deník včetně zápisu, přiložených souborů a exportu  

---

### ✅ Sprint 8: Úkoly a To-Do list

* Entita `Task`  
* CRUD endpointy pro úkoly  
* Filtrace podle projektu, uživatele, stavu  
* Přepínání stavu (hotovo / nehotovo)  

**Výstup:** Základní task management propojený s projekty  

---

### 🧮 Sprint 9: Rozpočet

* Entita `BudgetItem`  
* CRUD operace nad položkami  
* Výpočty (qty × unit price = total)  
* Kategorizace + validace dat  

**Výstup:** Rozpočtová tabulka propojená s projektem  

---

### 📎 Sprint 10: Správa souborů a tým

* Nahrávání dokumentů (PDF, DWG, obrázky)  
* Organizace dle projektu a složky  
* Seznam členů týmu + jejich oprávnění  
* Endpointy pro přidání / odebrání člena  

**Výstup:** Možnost spravovat dokumenty a členy týmu v rámci projektu  

---

### 🧪 Sprint 11: Stabilizace a testování

* Globální error handler (`@ControllerAdvice`)  
* Testy: `@DataJpaTest`, `@WebMvcTest`  
* Kontrola bezpečnosti endpointů  
* API dokumentace (Swagger / springdoc-openapi)  
* Připravit na pilotní testování  

**Výstup:** Kompletní MVP připraveno pro test ve 3–5 reálných firmách  
