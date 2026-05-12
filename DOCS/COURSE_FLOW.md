# Course flow and progress

## Table of contents

- [Hierarchy](#hierarchy)
- [Course status](#course-status)
- [Lessons and content types](#lessons-and-content-types)
- [Quizzes](#quizzes)
- [How progress is calculated](#how-progress-is-calculated)
- [Learning sequence](#learning-sequence)
- [Useful API routes](#useful-api-routes)

## Hierarchy

```text
Course
└── Module (ordered)
    └── Lesson (ordered)
        └── Quiz (optional, one per lesson)
```

Database shape: `Course` → `Module` → `Lesson`; `Quiz` is tied to a lesson. See `prisma/schema.prisma` for exact relations.

## Course status

| Status      | Typical use                                                   |
| ----------- | ------------------------------------------------------------- |
| `DRAFT`     | Authoring; not visible to learners as a normal catalog course |
| `PUBLISHED` | Visible to eligible learners; enrollable                      |
| `ARCHIVED`  | Hidden from typical learner views; authors may still manage   |

Exact visibility depends on role and department rules in the API (see course list endpoints).

## Lessons and content types

Authors pick a content type when editing a lesson:

- **Text** — Tiptap rich text, stored as HTML (`src/components/ui/rich-text-editor.tsx`).
- **SCORM** — Planned / not fully wired for all flows (check UI for current support).
- **Multimedia** — Files uploaded to optional **Bunny** storage; URLs served via CDN when configured.

## Quizzes

- Questions are stored on the `Quiz` model (JSON structure in the schema).
- Passing is typically **≥ 70%** correct; learners can **retry**; attempts are recorded (`QuizCompletion`).
- Passing a quiz can mark the lesson complete (see app logic and `Progress` records).

## How progress is calculated

- **Lesson complete** when the `Progress` row for `(userId, lessonId)` is completed, or when completion is implied after a passed quiz (implementation in API and `src/lib/progress-utils.ts`).
- **Course progress** = completed lessons in that course ÷ total lessons in that course (see `calculateCourseProgress` in `progress-utils.ts`).
- **Overall learner stats** aggregate enrollments and completed lessons across courses (`calculateOverallProgress` and dashboard endpoints).

For dashboard UX (e.g. “current course” highlighting), behavior is implemented in the dashboard UI and `/api/dashboard`.

## Learning sequence

1. User enrolls in a **published** course (if allowed).
2. User opens the course learn view and steps through **modules** and **lessons** in order.
3. If a lesson has a quiz, user passes or retries until pass (if required).
4. When all lessons are complete, the course is complete for that user.

## Useful API routes

| Area                          | Example route                                                     |
| ----------------------------- | ----------------------------------------------------------------- |
| Learner dashboard stats       | `GET /api/dashboard`                                              |
| Course progress               | `GET /api/courses/[id]/progress`                                  |
| Mark lesson progress          | `POST /api/progress` (and related)                                |
| Quiz completion               | `POST /api/quiz-completion`                                       |
| Department / author reporting | `GET /api/reports/departments`, `GET /api/admin/department-stats` |

Exact payloads and auth requirements are defined in each `route.ts` file under `src/app/api/`.
