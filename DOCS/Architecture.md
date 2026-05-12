# Architecture

## Table of contents

- [Stack](#stack)
- [Runtime flow](#runtime-flow)
- [Data model (conceptual)](#data-model-conceptual)
- [Authentication and authorization](#authentication-and-authorization)
- [External services](#external-services)
- [Repository layout](#repository-layout)
- [Deployment notes](#deployment-notes)

## Stack

| Layer     | Technology                                                               |
| --------- | ------------------------------------------------------------------------ |
| Framework | Next.js 15 (App Router), React 19, TypeScript                            |
| API       | Next.js Route Handlers (`src/app/api/**`)                                |
| Auth      | NextAuth.js v4 — Credentials provider, JWT sessions                      |
| Data      | Prisma ORM → **PostgreSQL** (local or hosted, e.g. Neon)                 |
| UI        | Tailwind CSS, Radix / shadcn-style components, Tiptap (lesson rich text) |
| Quality   | ESLint, Prettier, Vitest, Playwright                                     |

## Runtime flow

1. **Browser** → Next.js pages (`src/app/`).
2. **Middleware** (`middleware.ts`) checks JWT for protected **pages**; `/api/*` is excluded — API routes enforce auth themselves.
3. **API handlers** load the user (`src/lib/session.ts`, `getCurrentUser`), then **RBAC** (`src/lib/rbac.ts`) or **permissions** (`src/lib/permissions.ts`, `requirePermission`).
4. **Prisma** (`src/lib/prisma.ts`) talks to Postgres.

## Data model (conceptual)

- **Department** — tenant boundary; optional parent/child hierarchy.
- **User** — belongs to a department; **Role**: `AUTHOR`, `ADMIN`, `BASIC`, `WRITER`.
- **Course → Module → Lesson** — optional **Quiz** per lesson; **Enrollment** and **Progress** link users to content.
- Quiz content and some metadata may be stored as JSON (see `prisma/schema.prisma`).

Multi-tenant rules (who sees which course/user) are implemented in route handlers and helpers such as `src/lib/department-utils.ts`.

## Authentication and authorization

- **Sign-in**: NextAuth credentials; passwords hashed with **bcrypt**; session in HTTP-only cookies.
- **Sign-up**: Invitation-based registration via `/api/auth/register` (not handled by NextAuth alone).
- **Guards**: `requireAuth`, `requireRole`, `requirePermission` in `src/lib/rbac.ts`.
- **Permission matrix**: See [access-matrix.md](./access-matrix.md) and `src/lib/permissions.ts`.

## External services

| Service                            | Purpose                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| **Upstash Redis** (optional)       | Distributed rate limiting; in-memory fallback if unset                                  |
| **Bunny Storage + CDN** (optional) | Multimedia uploads for lessons — see [BUNNY_STORAGE_SETUP.md](./BUNNY_STORAGE_SETUP.md) |

## Repository layout

```text
src/app/           # App Router: pages, layouts, API routes
src/components/    # UI
src/lib/           # auth, prisma, rbac, permissions, rate-limit, etc.
prisma/            # schema and migrations
DOCS/              # technical documentation
public/faq/        # end-user FAQ markdown
```

## Deployment notes

- Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` in production.
- Run `prisma migrate deploy` (or your host’s migration step) before or during deploy.
- HTTPS in production; cookies use `secure` when `NODE_ENV === production`.

For security configuration detail, see [SECURITY.md](./SECURITY.md).
