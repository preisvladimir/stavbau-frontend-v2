# API Contract – Auth (MVP)

## POST /auth/login
### Request
```json
{ "email": "user@example.com", "password": "string" }
# API Contract – Auth (MVP)

## POST /auth/login
### Request
```json
{ "email": "user@example.com", "password": "string" }
Response 200
json
Zkopírovat kód
{ "accessToken": "jwt", "expiresIn": 3600 }
Errors
401 invalid_credentials (viz common-errors.md)
