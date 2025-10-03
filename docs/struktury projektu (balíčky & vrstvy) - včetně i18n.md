BACKEND
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

FRONTEND
src/
├─ app/
│  ├─ main.tsx                         // bootstrap Reactu (providers: i18n, AuthProvider, ToastProvider, Router)
│  ├─ App.tsx                          // mount routeru + globální ErrorBoundary
│  └─ providers/                       // (vol.) separované providery
│
├─ routes/
│  ├─ router.tsx                       // createBrowserRouter: public (/login), private (/app/*)
│  ├─ AppLayout.tsx                    // topbar + sidebar + <Outlet/> (private shell)
│  └─ components/
│     ├─ Topbar.tsx                    // avatar, jazyk, logout, env badge
│     ├─ Sidebar.tsx                   // navigace podle scopes (Dashboard, Projects…)
│     └─ LanguageToggle.tsx            // přepínání cs/en (i18next)
│
├─ lib/
│  ├─ api/
│  │  ├─ client.ts                     // Axios instance (baseURL, JSON) + registrace interceptorů
│  │  ├─ interceptors.ts               // Authorization: Bearer, 401→refresh→retry, 403/429 UX
│  │  └─ types.ts                      // sdílené DTO typy (Login/Me/Refresh, PageResponse apod.)
│  ├─ rbac/
│  │  ├─ hasScope.ts                   // čistá utilita (anyOf/allOf)
│  │  └─ ScopeGuard.tsx                // komponenta pro kontrolu scopes (UI toggly)
│  ├─ utils/
│  │  ├─ env.ts                        // čtení VITE_* proměnných
│  │  ├─ time.ts                       // práce s expiresAt (ISO), isExpired(), secondsLeft()
│  │  └─ formatting.ts                 // měna, data, čísla podle i18n (zrcadlí BE FormattingUtils)
│  └─ ui/
│     ├─ ToastProvider.tsx             // shadcn/ui toast system
│     └─ EmptyState.tsx, ErrorState.tsx, Loading.tsx
│
├─ i18n/
│  ├─ index.ts                         // inicializace i18next (resources, fallbackLng, ns: common, auth, errors)
│  ├─ cs/
│  │  ├─ common.json
│  │  ├─ errors.json                   // 401/403/429/validační hlášky (RHF+Zod)
│  │  ├─ auth.json                     // login/me/refresh texty
│  │  └─ projects.json
│  └─ en/ (stejná struktura jako cs/)
│
├─ features/
│  ├─ auth/
│  │  ├─ pages/
│  │  │  └─ LoginPage.tsx              // form (RHF+Zod), loading, i18n, error handling
│  │  ├─ context/
│  │  │  └─ AuthContext.tsx            // user, companyRole, scopes, tokens, expiresAt
│  │  ├─ hooks/
│  │  │  └─ useAuth.ts                 // helper hook
│  │  ├─ services/
│  │  │  └─ AuthService.ts             // /auth/login, /auth/me, /auth/refresh
│  │  ├─ utils/
│  │  │  └─ mapAuthErrors.ts           // HTTP → i18n klíče
│  │  └─ guards/
│  │     ├─ ProtectedRoute.tsx         // vyžaduje přihlášení
│  │     └─ ScopeGuard.tsx             // vyžaduje scope
│  │
│  ├─ dashboard/
│  │  └─ pages/DashboardPage.tsx
│  ├─ projects/
│  │  ├─ pages/ProjectsListPage.tsx, ProjectNewPage.tsx
│  │  ├─ components/ProjectsTable.tsx, ProjectForm.tsx
│  │  ├─ services/ProjectsService.ts
│  │  └─ hooks/useProjects.ts, useCreateProject.ts
│  └─ …
│
├─ components/
│  ├─ form/ InputField.tsx, SelectField.tsx
│  ├─ layout/
│  └─ icons/
│
├─ styles/ index.css, tokens.css
├─ tests/ lib/api/__tests__/interceptors.test.ts
└─ e2e/ smoke.login.spec.ts            // login → dashboard
