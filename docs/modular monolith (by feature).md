1) Vysoká úroveň: přístup „modular monolith (by feature)“

Primární organizace podle domén (bounded contexts), ne podle vrstev. Každá doména (např. projects, budget, files, logs, později marketplace) obsahuje své API, DTO, service, repo, model, mapper, web.

Sdílené věci jdou do common/, security/, config/, infrastructure/.

Jedna spustitelná aplikace (Spring Boot), ale přísná hranice mezi moduly přes balíčkovou strukturu a konvence.

2) Návrh struktury projektu (balíčky & vrstvy)

cz.stavbau.backend/
├─ StavbauBackendApplication.java
├─ config/
│  ├─ SecurityConfig.java
│  ├─ CorsConfig.java
│  ├─ JacksonConfig.java
│  ├─ OpenApiConfig.java
│  ├─ PersistenceConfig.java
│  ├─ CacheConfig.java
│  ├─ FlywayConfig.java
│  └─ MessageSourceConfig.java          // i18n MessageSource (+ ICU), fallback řetězec
│
├─ common/
│  ├─ api/
│  │  ├─ ApiExceptionHandler.java      // RFC7807 (ProblemDetail), lokalizované zprávy
│  │  ├─ PageResponse.java
│  │  └─ BaseController.java
│  ├─ domain/
│  │  ├─ BaseEntity.java                // UUID id, auditing
│  │  ├─ CompanyScoped.java            // companyId guard
│  │  └─ enums/ VatMode.java, Currency.java, LocaleCode.java (ISO)
│  ├─ i18n/
│  │  ├─ LocaleResolver.java           // ?lang -> Accept-Language -> user -> company -> default
│  │  ├─ LocaleContext.java            // přenáší resolved Locale skrz service
│  │  ├─ MessageService.java           // obálka nad MessageSource (keys + args)
│  │  ├─ EnumLabeler.java              // enum → lokalizovaný štítek (pro DTO)
│  │  └─ FormattingUtils.java          // formát měny, dat, čísel dle locale
│  ├─ mapping/
│  │  ├─ MapStructCentralConfig.java
│  │  └─ CommonMappers.java
│  ├─ persistence/
│  │  ├─ JpaAuditingConfig.java
│  │  ├─ JsonbConfig.java
│  │  └─ Specifications.java
│  ├─ events/
│  │  ├─ DomainEvent.java
│  │  └─ EventPublisher.java
│  └─ util/ ...
│
├─ security/
│  ├─ jwt/ JwtService.java, JwtAuthenticationFilter.java, JwtProperties.java
│  ├─ rbac/ Scopes.java, CompanyRoleName.java, ProjectRoleName.java, AppUserPrincipal.java
│  └─ SecurityUtils.java               // currentUserId(), currentCompanyId(), currentLocale()
│
├─ tenants/
│  ├─ model/ Company.java
│  ├─ dto/ CompanyDto, CreateCompanyRequest, UpdateCompanyRequest
│  ├─ repo/ CompanyRepository.java
│  ├─ service/ CompanyService.java     // defaultLocale, currency, invoiceNumbering prefs
│  └─ web/ CompanyController.java
│
├─ users/
│  ├─ model/ User.java                 // preferovaná locale (nullable)
│  ├─ dto/ UserDto, CreateUserRequest, UpdateUserRequest
│  ├─ repo/ UserRepository.java
│  ├─ service/ UserService.java
│  └─ web/ UserController.java
│
├─ projects/
│  ├─ model/ Project.java
│  ├─ model/ ProjectTranslation.java    // (project_id, locale, name, description) — i18n tabulka
│  ├─ dto/ ProjectDto, ProjectI18nDto, CreateProjectRequest, UpdateProjectRequest
│  ├─ repo/ ProjectRepository.java, ProjectTranslationRepository.java
│  ├─ service/ ProjectService.java      // čte s i18n fallbacky (resolved → company → app)
│  ├─ mapper/ ProjectMapper.java        // + enum labely přes EnumLabeler
│  └─ web/ ProjectController.java
│
├─ budget/
│  ├─ model/ Budget.java, BudgetItem.java, BudgetItemTranslation.java
│  ├─ dto/ BudgetItemDto, BudgetItemI18nDto, CreateBudgetItemRequest, ...
│  ├─ repo/ BudgetItemRepository.java, BudgetItemTranslationRepository.java
│  ├─ service/ BudgetService.java
│  ├─ mapper/ BudgetMapper.java
│  └─ web/ BudgetController.java
│
├─ files/
│  ├─ model/ ProjectFile.java, FileTag.java, FileTagTranslation.java
│  ├─ dto/ ProjectFileDto, UploadRequest
│  ├─ repo/ ProjectFileRepository.java, FileTagTranslationRepository.java
│  ├─ service/ FileStorageService.java, ProjectFileService.java
│  ├─ mapper/ FileMapper.java
│  └─ web/ FileController.java
│
├─ logs/
│  ├─ model/ LogEntry.java, WeatherInfo (JSONB)
│  ├─ dto/ LogEntryDto, CreateLogEntryRequest
│  ├─ repo/ LogEntryRepository.java
│  ├─ service/ LogService.java
│  ├─ mapper/ LogMapper.java
│  └─ web/ LogController.java
│
├─ invoices/                            
│  ├─ model/
│  │  ├─ Invoice.java                   // číslo, datumy, měna, sumy (ex/vat), companyId, projectId?
│  │  ├─ InvoiceLine.java               // položky s vazbou na BudgetItem (optional)
│  │  ├─ InvoiceTranslation.java        // (invoice_id, locale, title, notes, paymentTermsText)
│  │  ├─ NumberSeries.java              // číselné řady per company, rok, prefix/suffix
│  │  ├─ Customer.java                  // fakturační údaje odběratele (ne nutně ve users)
│  │  └─ enums/ PaymentStatus.java, InvoiceType.java (ISSUED/PROFORMA/CREDIT), DeliveryMode.java
│  ├─ dto/
│  │  ├─ InvoiceDto                     // 1 jazyk (resolved), obsahuje i enum labely
│  │  ├─ InvoiceI18nDto                 // volitelně všechny překlady pro editor
│  │  ├─ CreateInvoiceRequest, UpdateInvoiceRequest
│  │  ├─ InvoiceLineDto, CreateInvoiceLineRequest, ...
│  │  └─ NumberSeriesDto, ConfigureSeriesRequest
│  ├─ repo/
│  │  ├─ InvoiceRepository.java, InvoiceLineRepository.java
│  │  ├─ InvoiceTranslationRepository.java
│  │  └─ NumberSeriesRepository.java, CustomerRepository.java
│  ├─ service/
│  │  ├─ InvoiceService.java            // vystavení, změny stavu, i18n fallbacky
│  │  ├─ NumberSeriesService.java       // rezervace čísel, atomická transakce
│  │  ├─ InvoicePdfService.java         // generování PDF (locale-aware datumy, měny)
│  │  └─ InvoiceEmailService.java       // odesílání e-mailem s i18n šablonou
│  ├─ mapper/
│  │  └─ InvoiceMapper.java, InvoiceLineMapper.java
│  └─ web/
│     ├─ InvoiceController.java         // /api/v1/invoices
│     ├─ InvoiceLinesController.java    // /api/v1/invoices/{id}/lines
│     └─ NumberSeriesController.java    // /api/v1/invoices/series
│
├─ integrations/
│  ├─ ares/ AresClient.java, AresService.java       // i18n názvy oborů (labels přes messages)
│  └─ email/ EmailSenderService.java, templates/
│
└─ infrastructure/
   ├─ sse/ SseSupport.java
   ├─ storage/ LocalFsStorage.java, S3Storage.java
   ├─ mail/ MailConfig.java
   └─ scheduling/ ScheduledJobs.java

Testy

src/test/java/cz/stavbau/backend/
├─ common/ ... unit test utils
├─ *Feature*/ web/ ... @WebMvcTest
├─ *Feature*/ repo/ ... @DataJpaTest + Testcontainers (PostgreSQL)
└─ integration/ ... @SpringBootTest (happy-path flows)


Resources

src/main/resources/
├─ db/migration/ V1__init.sql, V2__users.sql, ...
├─ application.yml (profiles: dev, test, prod)
├─ templates/ (e-maily)
└─ static/ (pokud bude třeba)

3) Konvence a standardy
3.1 Entity (JPA)

Primární klíč: UUID (vygenerován v aplikaci).

Základ: BaseEntity s poli id, createdAt, createdBy, updatedAt, updatedBy (Spring Data Auditing).

Multi-tenancy: Entity „patřící firmě“ implementují CompanyScoped (pole companyId: UUID). Na úrovni repository/service vždy filtruj podle SecurityUtils.currentCompanyId().

Soft delete (volitelné): deletedAt + @Where(clause = "deleted_at is null") pro entity, kde dává smysl.

Validace: Bean Validation (@NotNull, @Size, ...). Validuj i Request objekty v kontrolerech.

Konvence názvů tabulek/sloupců: snake_case (pomocí Hibernate physical naming strategy). JSONB pro komplexní struktury (např. weather_info).

3.2 DTO a Request/Response

Sufixy:

XxxDto — přenosový objekt pro čtení (read model)

CreateXxxRequest, UpdateXxxRequest — zápisové modely

XxxSummaryDto — zkrácené listing DTO

XxxDetailDto — detailní zobrazení

Nikdy nevystavuj JPA entity přímo přes REST.

Stránkování: používej PageResponse<T> (obsahuje items, page, size, total).

3.3 Service vrstva

Smlouvy: Rozhraní XxxService + implementace XxxServiceImpl (u menších modulů lze bez rozhraní, ale držme konzistenci).

Transakce: @Transactional na service metodách; čtecí operace readOnly = true.

Doménová logika uvnitř service. Kontrolery jsou tenké.

Události: pro asynchronní akce publikuj DomainEvent.

3.4 Repository vrstva

XxxRepository extends JpaRepository<...> případně JpaSpecificationExecutor.

Specifikace/Query dsl pro komplexní filtry (balíček common.persistence).

3.5 Controller vrstva (REST)

Base path: /api/v1/...

Konvence názvů: XxxController (feature-scoped, ne „global”).

Validace: @Validated + @Valid u metod.

Chyby: jednotné přes @RestControllerAdvice (RFC7807 ProblemDetail).

Autorizace: @PreAuthorize s RBAC/Scopes a SpEL (např. @PreAuthorize("@projectAuth.canRead(#projectId)")).

Media types: JSON; pro soubory application/octet-stream a Content-Disposition.

3.6 Mapování (MapStruct)

Konfig: @MapperConfig v common.mapping.MapStructCentralConfig (unified policy).

Mappery: XxxMapper v balíčku feature/mapper.

**Mapování kolekcí:**helpers (např. toDtoList).

Zásada: Mapper nevolá repository; pouze transformace.

3.7 Bezpečnost (JWT + RBAC + Tenancy)

JWT: JwtAuthenticationFilter (Bearer), JwtService (sign/verify, refresh).

Principal: AppUserPrincipal (userId, email, companyId, role, scopes).

Role & Scopes:

Company role (OWNER, ADMIN, MANAGER, WORKER, VIEWER) → předvýchozí scopes (stringové konstanty v Scopes.java).

Projektová role (PROJECT_OWNER, EDITOR, VIEWER).

Autorizace:

Globální: @PreAuthorize("hasAuthority('PROJECTS_READ')")

Kontekstová: SpEL služby: @projectAuth.canEdit(#projectId)

Tenancy enforcement: v service/repo přes companyId (guardy), případně Hibernate Filter.

3.8 Migrace a DB

Flyway (db/migration) jako zdroj pravdy schématu.

Testcontainers pro integrační testy s PostgreSQL.

3.9 Logging & Observability

Logging: JSON-ready pattern (logback-spring.xml). Korelovat requestId, userId, companyId.

Exception telemetry: jednotné error pole + code.

3.10 API dokumentace

springdoc-openapi na /swagger-ui.html + /v3/api-docs.

Tagy per feature (Projects, Budget, Files...).

4) URL konvence (příklady)

/api/v1/auth/login, /api/v1/auth/refresh

/api/v1/users, /api/v1/companies

/api/v1/projects

GET /{projectId} – detail

GET /{projectId}/tasks – list

POST /{projectId}/files – upload

GET /{projectId}/budget-items/top?limit=5

/api/v1/logs?from=2025-09-01&to=2025-09-07&page=0&size=20

5) Pojmenování & kódové konvence

Balíčky: cz.stavbau.backend.<feature>.(model|dto|repo|service|web|mapper)

Třídy:

Entity: Project, BudgetItem (bez suffixu „Entity“)

Repo: ProjectRepository

Service: ProjectService, ProjectServiceImpl

Controller: ProjectController

DTO: ProjectDto, ProjectSummaryDto, CreateProjectRequest, UpdateProjectRequest

Mapper: ProjectMapper

Metody:

Service CRUD: create, update, delete, get, list, search

Controller akce: odpovídající HTTP: GET/POST/PUT/PATCH/DELETE

6) Chyby & výjimky (RFC7807)

Vše centralizovaně přes ApiExceptionHandler.

Využij ProblemDetail (Spring 6): vracej type, title, status, detail, instance, případně code.

Doménové výjimky: NotFoundException, ForbiddenException, ConflictException atd.

7) Validace & normalizace

Request objekty s @NotBlank/@Email/@Positive…

Custom validators (např. „endDate >= startDate“).

Normalizace (trim, case) v service vrstvě nebo pomocí Value Objects.

8) Caching (volitelné)

Caffeine pro rychlé cache (např. lookup scopes), TTL per use-case.

Redis lze připojit později bez změny API.

9) Testovací strategie

Unit: čistá doménová logika (bez spring contextu).

Slice: @DataJpaTest (repo), @WebMvcTest (kontrolery).

Integration: @SpringBootTest + Testcontainers (PostgreSQL).

Strategie i18n/l10n od 1. dne – pro REST API, databázi, šablony e-mailů i vyhledávání.

1) Jak budeme „volit jazyk“ (negociace)

Zdroj pravdy pro jazyk (v pořadí fallbacků):

?lang=cs|en|… (explicitní override v URL)

Accept-Language hlavička

User profile (preferovaná lokalizace)

Company (tenant) default locale (např. firma jede česky)

App default (cs_CZ)

Co vracíme:

Nastavený jazyk dáme do Content-Language (např. Content-Language: cs-CZ).

Pro cache: přidáme Vary: Accept-Language.

Kde to žije:

Jedna komponenta: LocaleResolver (request scoped), kterou použijeme ve:

validaci a chybách (MessageSource),

generování e-mailů, PDF,

mapování DTO (lokalizované labely, názvy, popisy).

Rozhodnutí: API nemá jazyk v URL (žádné /api/cs/...). Jazyk je meta-informace (query, headers), aby bylo API stabilní pro FE/mobile.

2) Co je „překlad“ v našich datech (modelování v DB)

Máme dva typy textů:

A) UI/technické texty (chyby, validační zprávy, enum štítky)

Uložené v properties (messages_cs.properties, messages_en.properties).

Formát ICU MessageFormat (pluralizace, datumy/čísla).

Enumy nepřekládáme v DB – překládáme na hraně (DTO) přes klíče enum.project.status.OPEN.

B) Doménová data, která má psát uživatel (název projektu, popis položky rozpočtu, inzerát v marketplace…)

Tady jsou 3 běžné přístupy – doporučuju (1) translation table:

Translation table (normalizované) – doporučeno

project (id, …)

project_translation (project_id, locale, name, description, UNIQUE(project_id, locale))

Výhody: čisté dotazy, indexy, fulltext per jazyk, kontrola validace, nemíchá se to s jinými poli.

Nevýhoda: víc joinů (ale v pohodě).

JSONB sloupec translations (např. {"cs":{...},"en":{...}})

Rychlé MVP, snadné přidávání jazyků.

Nevýhoda: složitější validace, fulltext a unikáty, těžší consistency.

Více sloupců name_cs, name_en

Nedoporučeno pro škálování jazyků.

Rozhodnutí pro Stavbau: A1) Translation table pro entity, kde dává smysl vícejazyčný obsah: Project, BudgetItem, Listing (marketplace), CompanyProfile, FileTag, TaskTemplate apod.
Menší textíky (např. poznámky v deníku stavby) necháme jednokjazykové (píšeme v jazyce uživatele).

3) API kontrakty & DTO

DTO vrstvy:

XxxDto – uživatelský pohled v 1 jazyce (už vybraném resolverem).

XxxI18nDto – volitelně „mapa všech překladů“ (pro adminy/editor).

CreateXxxRequest / UpdateXxxRequest:

buď jednojazyčné (nejčastější),

nebo i18n payload (např. translations: { cs: {...}, en: {...} }) tam, kde potřebujeme hned víc jazyků (třeba marketplace).

Konvence endpointů:

GET /api/v1/projects/{id} → vrátí ProjectDto v „resolved“ jazyce + Content-Language.

GET /api/v1/projects/{id}?allTranslations=true → vrátí i ProjectI18nDto.

POST /api/v1/projects – přijímá CreateProjectRequest (minimálně v jazyce uživatele).
Volitelně translations při zakládání (pro marketplace editor).

Enumy:

V JSONu posíláme machine value (např. "IN_PROGRESS").

Pro zobrazení dáme do extra pole:
statusLabel: "Rozpracováno" podle jazyka – generuje mapper/service přes MessageSource.

4) Konvence pro FE/mobile integraci

Jazyk posílá FE buď ?lang= nebo Accept-Language.

Error payload je lokalizovaný (ProblemDetail.detail), ale kromě textu vždy obsahuje:

code (strojový kód chyby, stabilní),

volitelně args (pro klientské přeložení, kdyby bylo potřeba).

Listovací endpointy respektují jazyk (název, popis v aktuálním jazyce; fallback do defaultu, když překlad chybí – viz níže).

5) Fallback strategie pro překlady v datech

Při čtení Project:

Zkus project_translation v resolvedLocale (např. en_GB → normalizovat na en).

Pokud není, zkus companyDefaultLocale.

Pokud není, zkus appDefaultLocale (cs).

Pokud nic, vrať prázdný text a translationMissing=true (nebo null) – klient může zvýraznit.

Důležité: Fallback děláme v service vrstvě, aby FE nemuselo konstruovat logiku.

6) Validace & chybové zprávy

Všechny validační texty v messages_*.properties.

Custom anotace (např. @EndDateAfterStartDate) mají message key ({validation.date.range}).

ApiExceptionHandler překládá doménové výjimky přes MessageSource (klíč + args).

Konvence kódů chyb: project.not_found, budget.item.duplicate_code, …

7) Šablony e-mailů & dokumenty (PDF)

Šablony po jazycích: templates/email/reset_password_cs.html, ..._en.html.
Případně Thymeleaf + MessageSource v jednom.

PDF/Doc generátory (faktury, nabídky): jazyk a lokální formát (datum, měna) z LocaleResolveru + Currency z firmy/zakázky.

8) Vyhledávání & fulltext (PostgreSQL)

Pro tabulky s překlady nastavíme per-locale fulltext:

project_translation má sloupce name, description, locale, tsv (index GIN).

tsv generujeme s parserem podle jazyka (to_tsvector('simple' | 'english' | 'czech', ... )).

Hledání:

dotaz respektuje resolvedLocale; volitelně allLocales=true (pak OR přes všechny).

Kolace a třídění: nastavíme DB cluster/DB collation rozumně, ale třídění v UI dle potřeby.

9) Architektura v kódu (kam co patří)
common/i18n/
  ├─ LocaleResolver.java          // vyjedná jazyk (query/header/user/company/default)
  ├─ Language.java                // enum ISO codes (en, cs, sk...)
  ├─ MessageKeys.java             // centrální keys pro chyby/enumy (optional)
  ├─ MessageService.java          // wrap nad MessageSource pro typed přístupy
  └─ FormattingUtils.java         // datumy/čísla měny dle Locale

config/
  ├─ JacksonConfig.java           // Locale-aware serializers (pokud třeba)
  ├─ MessageSourceConfig.java     // ReloadableResourceBundleMessageSource
  └─ WebConfig.java               // interceptor registrace LocaleResolveru

projects/
  ├─ model/ Project.java
  ├─ model/ ProjectTranslation.java        // (project_id, locale, name, description)
  ├─ repo/ ProjectRepository.java
  ├─ repo/ ProjectTranslationRepository.java
  ├─ service/ ProjectService.java          // get(dtoLocale), create(reqLocale,...)
  ├─ web/ ProjectController.java           // Content-Language, Vary
  └─ mapper/ ProjectMapper.java            // entity <-> dto, doplní statusLabel

Resources (i18n a šablony)
src/main/resources/
├─ messages_cs.properties
├─ messages_en.properties
├─ templates/
│  ├─ email/
│  │  ├─ invoice_email_cs.html
│  │  └─ invoice_email_en.html
│  └─ pdf/
│     ├─ invoice_cs.html               // pokud HTML→PDF renderer
│     └─ invoice_en.html
└─ db/migration/
   ├─ V1__init_core.sql                // users, companies (vč. default_locale), projects
   ├─ V2__i18n_translations.sql        // *_translation skeleton (project, budget_item, file_tag)
   └─ V3__invoices.sql                 // invoice, invoice_line, invoice_translation, number_series, customer

Konvence:

XxxTranslation je vždy child s UNIQUE(parent_id, locale).

Do DTO dáváme pouze jeden jazyk (resolved). Volitelně endpoint pro editory: GET ...?allTranslations=true.

10) Konvence pro Entity/DTO/Service/Controller/Mapper (i18n aspekty)

Entity: parent + XxxTranslation (locale jako varchar(10) – cs, cs-CZ, en).

DTO: textová pole jsou již v jednom jazyce. Přidej contentLanguage do meta (nebo hlavička).

Service: každá get/list přijímá LocaleContext (nebo zjistí z LocaleResolveru). Dělá fallbacky.

Controller: nepřekládá nic; jen předává Locale do service a nastaví hlavičky.

Mapper: když je potřeba label pro enum, přes MessageService → statusLabel.

11) Testovací strategie pro i18n

WebMvcTest: testy, že Accept-Language → dostanu odpověď v daném jazyce + Content-Language.

Service: unit testy fallbacků (missing translation → company → app default).

Repo: @DataJpaTest fulltext index per locale (aspoň smoke test).

12) Minimální DB kostra (pro Flyway návrh – bez kódu)

users (id uuid, ..., locale varchar(10) null)

companies (id uuid, ..., default_locale varchar(10) not null default 'cs')

projects (id uuid, company_id uuid not null, ...)

project_translations (project_id uuid, locale varchar(10), name text, description text, PRIMARY KEY(project_id, locale))

project_translations.tsv_en (materialized) / nebo computed column dle zvoleného přístupu.

Podobně pro budget_item_translations, listing_translations, …

13) Architektonický mini-diagram
[ Request ] --(Accept-Language / ?lang)--> [ LocaleResolver ]
                                   |             |
                                   v             v
                              [ Controller ] -> [ Service ]
                                                  |
                               [ MessageSource ]  |  [ Repos ]
                                   |              |      |
                            (errors/labels)       |  [Entity + Translation]
                                                  |
                                           [ Fallback chain ]
                                                  |
                                             [ DTO (1 locale) ]