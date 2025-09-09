# Auth Flow (MVP) – JWT v headeru

## Cíl
Krátkodobě zafixovat přihlašovací tok pro MVP bez zbytečné složitosti.

## Rozhodnutí (shrnutí)
- Token: **Bearer JWT** v `Authorization` headeru.
- Přihlášení: `POST /auth/login` → 200 + { accessToken, expiresIn }.
- Obnova: pro MVP bez refresh tokenu (viz Next Steps).
- CORS: povolit pouze FE dev origin.

## Sekvence
1) FE → BE `/auth/login` (email + password)
2) BE → JWT (sub, role, scopes, exp)
3) FE ukládá token do memory (ne LocalStorage); přidává header na každý request.

## Bezpečnostní filtry (pořadí)
1. `RateLimitFilter`
2. `JwtAuthenticationFilter`
3. `UsernamePasswordAuthenticationFilter`

## Chybové stavy
- 401: invalid/expired token
- 403: insufficient scope/role
- Používat jednotné tělo dle `../api-contracts/common-errors.md`.

## Next Steps (design, ne MVP)
- Cookie-based (HttpOnly, SameSite=strict) + CSRF header `X-XSRF-TOKEN`.
- Refresh token rotation.
