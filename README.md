# FOX-LMS

Multi-tenant learning management app: departments, role-based access, courses (modules → lessons → optional quizzes), progress tracking, and admin/author tooling. Built with **Next.js 15** (App Router), **React 19**, **TypeScript**, **Prisma**, **PostgreSQL**, and **NextAuth** (credentials + JWT).

## Table of contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Useful commands](#useful-commands)
- [Documentation](#documentation)
- [User-facing help (FAQ)](#user-facing-help-faq)

## Overview

- **Learners** enroll in published courses and complete lessons; progress and quizzes are stored in the database.
- **Admins / Authors** manage users, courses, and reporting according to [role permissions](DOCS/access-matrix.md).
- **API routes** live under `src/app/api/`; page auth is enforced by middleware; API routes use server-side guards (`src/lib/rbac.ts`, `src/lib/permissions.ts`).
- **Docs** in this repo: technical references under [`DOCS/`](DOCS/); end-user FAQ Markdown under [`public/faq/`](public/faq/) (served or consumed by the FAQ UI as configured).

## Prerequisites

- **Node.js** 24+ (see `.nvmrc` / `.node-version` and `package.json` `engines`)
- **npm** (lockfile: `package-lock.json`)
- **PostgreSQL** for local or hosted DB ([Neon](https://neon.tech) or any Postgres; CI uses Postgres 15)

## Local development

1. **Clone** the repository and install dependencies:

   ```bash
   npm ci
   ```

2. **Configure environment** — copy `.env.example` to `.env` (or `.env.local`) and set at least:
   - `DATABASE_URL` — PostgreSQL connection string
   - `NEXTAUTH_SECRET` — strong secret (e.g. `openssl rand -base64 32`)
   - `NEXTAUTH_URL` — app origin, e.g. `http://localhost:3000`

3. **Database**:

   ```bash
   npx prisma migrate dev
   ```

   Or use `npm run dev:setup` if you use the scripted migrate + dev user flow (see `package.json`).

4. **Run the app**:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign-in and invitation-based sign-up flows are under `/sign-in` and `/sign-up`.

## Environment variables

See **`.env.example`** for the full list (database, NextAuth, optional Upstash Redis for rate limits, Bunny storage for multimedia, etc.). [DOCS/BUNNY_STORAGE_SETUP.md](DOCS/BUNNY_STORAGE_SETUP.md) and [DOCS/SECURITY.md](DOCS/SECURITY.md) describe optional services in more detail.

## Useful commands

| Command                                 | Purpose                        |
| --------------------------------------- | ------------------------------ |
| `npm run dev`                           | Dev server (Turbopack)         |
| `npm run build` / `npm run start`       | Production build and run       |
| `npm run lint` / `npm run format:check` | Lint / Prettier check          |
| `npm test`                              | Unit tests (Vitest)            |
| `npm run test:e2e`                      | E2E tests (Playwright)         |
| `npx prisma studio`                     | Database GUI                   |
| `npm run prisma:migrate:dev`            | Create/apply migrations in dev |

## Documentation

Technical documentation lives in **`DOCS/`**:

| Document                                                   | Contents                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [DOCS/Architecture.md](DOCS/Architecture.md)               | Stack, request flow, data model overview, deployment notes      |
| [DOCS/access-matrix.md](DOCS/access-matrix.md)             | Roles → permissions; aligns with `src/lib/permissions.ts`       |
| [DOCS/COURSE_FLOW.md](DOCS/COURSE_FLOW.md)                 | Course hierarchy, progress and quiz behavior, key API routes    |
| [DOCS/SECURITY.md](DOCS/SECURITY.md)                       | Rate limiting, sessions, CSRF, validation, production checklist |
| [DOCS/BUNNY_STORAGE_SETUP.md](DOCS/BUNNY_STORAGE_SETUP.md) | Multimedia storage (Bunny) env and setup                        |
| [DOCS/GIT_HOOKS.md](DOCS/GIT_HOOKS.md)                     | Husky, lint-staged, pre-commit behavior                         |

## User-facing help (FAQ)

End-user topics (editable Markdown) are in **`public/faq/`**:

| File                                                               | Topic                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| [public/faq/getting-started.md](public/faq/getting-started.md)     | Courses, enrollment, roles, profile                     |
| [public/faq/course-content.md](public/faq/course-content.md)       | Lesson types, quizzes, navigation                       |
| [public/faq/course-management.md](public/faq/course-management.md) | Authors: creating courses, modules, lessons, publishing |
| [public/faq/progress-tracking.md](public/faq/progress-tracking.md) | How progress and completion work                        |
| [public/faq/user-management.md](public/faq/user-management.md)     | Admins: users, enrollments, branding (where applicable) |
| [public/faq/technical-support.md](public/faq/technical-support.md) | Browser support, troubleshooting                        |
| [public/faq/terms-conditions.md](public/faq/terms-conditions.md)   | Terms of service template                               |
