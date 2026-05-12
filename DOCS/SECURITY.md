# Security

## Table of contents

- [Overview](#overview)
- [Rate limiting](#rate-limiting)
- [Sessions and cookies](#sessions-and-cookies)
- [CSRF and origins](#csrf-and-origins)
- [Input validation](#input-validation)
- [Headers](#headers)
- [Password policy](#password-policy)
- [Environment variables](#environment-variables)
- [Production checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

## Overview

The app uses **NextAuth** (JWT), **Prisma** (parameterized queries), **Zod** validation on inputs, optional **Upstash Redis** for rate limits, and **CSRF/origin** checks for state-changing API requests (`src/lib/csrf.ts`, `src/lib/rate-limit.ts`).

## Rate limiting

- Implemented in **`src/lib/rate-limit.ts`** with Upstash when `UPSTASH_REDIS_REST_*` is set; otherwise an in-memory fallback (fine for single-instance dev, not for multi-node production).
- Typical buckets: auth, registration, admin, courses, reports — tune limits in that file.

## Sessions and cookies

- JWT sessions; **HTTP-only** cookies; **SameSite** `lax`; **secure** in production.
- Rotate **`NEXTAUTH_SECRET`** if compromised; users may need to sign in again.

## CSRF and origins

- Non-GET API requests should send a valid **`Origin`/`Referer`** aligned with **`NEXTAUTH_URL`** (and localhost in development). See `validateCSRF` in `src/lib/csrf.ts`.

## Input validation

- Prefer **Zod** schemas for request bodies in API routes.
- **Prisma** prevents SQL injection for query paths that use its API.

## Headers

Responses may include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and **CSP** — see `addCSRFHeaders` in `src/lib/csrf.ts` (CSP may need tuning if you add new asset domains).

## Password policy

Registration and password change flows enforce length and complexity rules (see validation schemas and auth-related routes).

## Environment variables

Minimum for a secure deployment:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."        # openssl rand -base64 32
NEXTAUTH_URL="https://your-domain.com"
```

Optional:

```bash
UPSTASH_REDIS_REST_URL="https://....upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."
```

## Production checklist

- [ ] HTTPS only; `NEXTAUTH_URL` matches public URL
- [ ] Strong `NEXTAUTH_SECRET`; secrets not in git
- [ ] Postgres connection uses TLS if provider requires it
- [ ] Upstash (or equivalent) for rate limits on production traffic
- [ ] Dependency updates and `npm audit` reviewed periodically
- [ ] Error responses do not leak stack traces or secrets to clients

## Troubleshooting

| Symptom           | What to check                                      |
| ----------------- | -------------------------------------------------- |
| 403 on API POST   | `Origin`, `NEXTAUTH_URL`, CSRF/session cookies     |
| Rate limit errors | Upstash env vars; adjust limits in `rate-limit.ts` |
| Random logouts    | Secret rotation; clock skew; cookie domain         |

For architecture context, see [Architecture.md](./Architecture.md). For role capabilities, see [access-matrix.md](./access-matrix.md).
