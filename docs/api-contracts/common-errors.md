# API Contract – Common Errors

## Tělo chyby (příklad)
```json
{
  "error": "invalid_request",
  "message": "Detail chyby",
  "correlationId": "uuid"
}
Mapování
400 invalid_request

401 unauthorized

403 forbidden

404 not_found

409 conflict

500 server_error

markdown
Zkopírovat kód
