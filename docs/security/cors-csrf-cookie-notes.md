# CORS, CSRF & Cookie – Poznámky k budoucímu přechodu

## CORS
- DEV: whitelist pouze FE dev origin.
- PROD: konkrétní domény, žádné wildcard.

## CSRF & Cookie varianta
- HttpOnly + Secure + SameSite=strict cookies.
- CSRF token v `X-XSRF-TOKEN` hlavičce.
- Impakt na FE interceptory a BE konfiguraci.
