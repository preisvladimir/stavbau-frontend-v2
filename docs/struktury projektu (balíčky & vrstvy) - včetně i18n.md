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
