# Observability – Health & Logging (MVP)

## Healthchecks
- `/actuator/health` – app, DB.
- Zahrnout do CI smoke testu.

## Logování
- Strukturované logy: `requestId`, `userId` (pokud přihlášen), latency.
- Doporučení MDC + sjednocený pattern (viz `log-format.md`).

## FE Ping obrazovka
- Komponenta, která zobrazuje stav BE (UP/DOWN).

## Incidenty
- Postup: reprodukce, korelační ID, poslední releasy, rollback plán.
