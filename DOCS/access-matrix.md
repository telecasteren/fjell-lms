# Access matrix (roles → permissions)

## Table of contents

- [Purpose](#purpose)
- [Permissions](#permissions)
- [Roles](#roles)
- [Implementation](#implementation)

## Purpose

Single reference for **what each role is allowed to do** at the application level. Server routes should use `requirePermission(...)` and tenant helpers (`getAccessibleDepartmentIds`, etc.) so API behavior matches the UI.

## Permissions

| Permission        | Meaning                                           |
| ----------------- | ------------------------------------------------- |
| `dashboard:view`  | Personal dashboard and progress                   |
| `learning:access` | Course learning flow                              |
| `author:access`   | Author dashboard and platform-wide author actions |
| `admin:access`    | Admin dashboard (department-scoped)               |
| `reports:view`    | Reports / analytics                               |
| `users:read`      | List users (scoped)                               |
| `users:invite`    | Create invitations / users (scoped)               |
| `users:manage`    | Edit / delete users (scoped)                      |
| `users:reassign`  | Move users between departments (scoped)           |
| `courses:read`    | View courses available to the role                |
| `courses:manage`  | Create / update / delete courses (scoped)         |
| `content:edit`    | Edit lessons and content                          |
| `branding:manage` | Department branding                               |
| `settings:manage` | Own profile / settings                            |

## Roles

| Role     | Summary                                                                   |
| -------- | ------------------------------------------------------------------------- |
| `AUTHOR` | Full authoring and cross-department management (as implemented in routes) |
| `ADMIN`  | Department (+ subtree) administration and reports                         |
| `WRITER` | Content and courses within their scope                                    |
| `BASIC`  | Learn and enroll; no admin/author tools                                   |

## Implementation

Role → permission mapping is defined in **`src/lib/permissions.ts`**. Route handlers call **`src/lib/rbac.ts`** (`requirePermission`, `requireRole`, etc.).
