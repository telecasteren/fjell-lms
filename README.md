# LMS Web Application

wwefbwekgbergbearbg

A comprehensive Learning Management System built with Next.js 15, featuring multi-tenant architecture, role-based access control, and modern security practices.

## Tech Stack

### Core Framework

- **Next.js 15** - App Router with TypeScript
- **React 18** - Component-based UI
- **TypeScript** - Type-safe development

### Styling & UI

- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Pre-built component library
- **Tomatogrotesk** - Primary font family
- **React Hot Toast** - Notifications
- **Tiptap** - Rich text WYSIWYG editor for lesson content

### Database & ORM

- **SQLite** - Development database
- **Prisma** - Database ORM and migrations
- **PostgreSQL** - Production database ready

### Authentication & Security

- **NextAuth.js** - Authentication framework
- **JWT Strategy** - Session management
- **bcrypt** - Password hashing
- **Rate Limiting** - Upstash Redis + fallback
- **CSRF Protection** - Origin validation
- **Input Validation** - Zod schemas

### Current Architecture:

- **Single Authentication System:** NextAuth with JWT strategy
- **Registration:** Custom /api/auth/register (necessary since NextAuth doesn't handle registration)
- **Sign-in:** NextAuth /api/auth/signin/credentials
- **Session Management:** NextAuth HTTP-only cookies and JWT tokens
- **Authorization:** getCurrentUser() and requireAuthorOnly() functions

### File Storage

- **Bunny Storage** - Cloud storage for multimedia files
- **CDN Delivery** - Global content delivery network
- **Pull Zone** - Optimized file serving
- **Cost-effective** - $0.01/GB storage pricing

### Testing

- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing
- **React Testing Library** - Component testing

### Development Tools

- **ESLint** - Code linting
- **Turbopack** - Fast bundler
- **React Hook Form** - Form management

## Features

### Multi-Tenant Architecture

- Department-based data isolation
- Scoped user management
- Department-specific courses

### Role-Based Access Control

- **Author** - Create/edit content, manage users
- **Admin** - Create users, view reports
- **Basic** - Access assigned courses

### Course Management

- Modules and lessons structure
- **Multiple content types**: Text editor, SCORM, and Multimedia support
- Progress tracking with standardized utilities
- Quiz system with retry functionality and 70% pass rate
- Course publishing workflow (DRAFT → PUBLISHED → ARCHIVED)
- Automatic lesson completion when quiz is passed
- Course deletion with cascade handling

### User Management

- User registration with department assignment
- Profile management
- Avatar system with initials fallback
- User re-association between departments

### Dashboard & Analytics

- Role-specific dashboards with real-time progress updates
- Department reports with individual user progress tracking
- Progress visualization with standardized calculation logic
- Course completion tracking across all enrolled courses
- Dashboard refresh mechanism for real-time updates

### Security Features

- Rate limiting (5 auth/min, 3 registration/hour)
- Secure session management
- CSRF protection
- Input validation and sanitization
- Centralized error handling

### Branding & Customization

- Dynamic theming (light/dark mode)
- Customizable branding settings
- Logo management
- Color scheme configuration
- **Department-specific branding** - Authors can upload custom logos and set custom logo text for each department

### Content Management

- **Multiple Content Types**: Support for different lesson content formats
  - **Text Editor**: Rich text WYSIWYG editor (Tiptap) with formatting toolbar
    - **Location**: `src/components/ui/rich-text-editor.tsx`
    - **Features**: Bold, italic, underline, headings (H1-H3), bullet/numbered lists, links, undo/redo
    - **Styling**: Centralized styling matching application design system
  - **SCORM**: SCORM package support (coming soon)
  - **Multimedia**: Video, audio, and interactive content (coming soon)
- **Content Type Selection**: Dropdown interface for authors to choose content type
- **Future-Ready**: Extensible architecture for additional content types

## Third-Party Services

### Authentication

- **NextAuth.js** - Session management
- **JWT** - Token-based authentication

### Rate Limiting

- **Upstash Redis** - Distributed rate limiting
- **Fallback** - In-memory rate limiting

### File Storage

- **Bunny Storage** - File uploads and storage
- **Bunny CDN** - Content delivery network
- **Pull Zone** - CDN-hosted multimedia files
- **Pricing** - $0.01/GB storage, cost-effective for 500GB (~$5/month)

## Cookie Configuration

### Session Cookies

- **Name**: `next-auth.session-token`
- **HttpOnly**: `true`
- **SameSite**: `lax`
- **Secure**: Production only
- **MaxAge**: 24 hours

### CSRF Protection

- **Name**: `next-auth.csrf-token`
- **HttpOnly**: `true`
- **SameSite**: `lax`

### Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Rate Limiting (Optional)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Bunny Storage (File Uploads)
BUNNY_STORAGE_API_KEY="your-storage-api-key"
BUNNY_STORAGE_BUCKET="your-storage-zone-name"
BUNNY_STORAGE_REGION="de"
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   │   └── rich-text-editor.tsx  # Tiptap WYSIWYG editor
│   ├── branding/         # Branding components
│   └── providers/        # Context providers
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Database client
│   ├── validation.ts    # Zod schemas
│   └── rate-limit.ts    # Rate limiting
├── test/                # Test files
│   ├── components/      # Component tests
│   ├── lib/            # Utility tests
│   └── e2e/            # End-to-end tests
└── prisma/             # Database schema
    ├── schema.prisma   # Database schema
    └── migrations/     # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Create dev user
node scripts/create-dev-user.mjs

# Start development server
npm run dev
```

### Test Credentials

- **Email**: `fox-author-dev@example.com`
- **Password**: `dev123`
- **Role**: Author

## Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npx prisma studio       # Database GUI
npx prisma migrate dev  # Run migrations
npx prisma generate     # Generate client

# Testing
npm test               # Run unit tests
npm run test:e2e       # Run e2e tests
npm run test:coverage  # Test coverage

# Linting
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `GET /api/auth/session` - Get session (NextAuth)
- `POST /api/auth/signin/credentials` - User signin (NextAuth)

### Courses

- `GET /api/courses` - List courses with enrollment status
- `POST /api/courses` - Create course
- `GET /api/courses/[id]` - Get course details
- `PATCH /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course (AUTHOR only)
- `GET /api/courses/[id]/progress` - Get course progress
- `GET /api/courses/[id]/modules` - Get course modules

### Users

- `GET /api/admin/users` - List users (Admin/Author)
- `POST /api/admin/users` - Create user (Admin/Author)
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user (Admin/Author only)
- `GET /api/session` - Get current user session
- `PATCH /api/settings/profile` - Update user profile

### Progress & Learning

- `GET /api/progress` - Get user progress
- `POST /api/progress` - Update lesson progress
- `POST /api/quiz-completion` - Save quiz results
- `GET /api/quiz-completion` - Get quiz completion status
- `GET /api/modules/[id]/lessons` - Get module lessons with quiz data
- `GET /api/lessons/[id]` - Get lesson details
- `PATCH /api/lessons/[id]` - Update lesson content (supports multiple content types)
- `DELETE /api/lessons/[id]` - Delete lesson (AUTHOR only)
- `GET /api/lessons/[id]/quiz` - Get lesson quiz

### Enrollments

- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in course
- `DELETE /api/enrollments` - Unenroll from course

### Reports & Analytics

- `GET /api/reports/departments` - Department analytics with user progress
- `GET /api/admin/department-stats` - Department statistics (Admin/Author)
- `GET /api/author/dashboard` - Author dashboard with department progress
- `GET /api/author/departments/[id]` - Department details (Author only)

### Department Branding

- `GET /api/departments/current` - Get current department branding (logo and text)
- `POST /api/departments/branding` - Update department branding (upload logo and set text) (Author only)

## Core Workflows

### Enrollment & Reassignment Flow

#### User Enrollment

1. **Course Discovery**: Users browse available courses in their department
2. **Enrollment Process**:
   - Click "Enroll" button on course card
   - System creates enrollment record linking user to course
   - User gains access to course content
3. **Progress Tracking**: System tracks lesson completion automatically
4. **Department Scoping**: Users can only enroll in courses from their department

#### User Reassignment (Admin/Author Only)

1. **Access Control**: Only ADMIN and AUTHOR roles can reassign users
2. **Reassignment Process**:
   - Navigate to user management interface
   - Select user to reassign
   - Choose new department from dropdown
   - Confirm reassignment action
3. **Automatic Cleanup**:
   - Removes user enrollments from courses not in new department
   - Preserves progress for courses that exist in both departments
   - Updates user's department association
4. **Self-Protection**: Users cannot reassign themselves

#### Department Management

- **AUTHOR Role**: Can manage users across all departments
- **ADMIN Role**: Can only manage users within their own department
- **Department Isolation**: Data is scoped per department for security

### Delete Operations & Cascade Handling

#### Course Deletion

**Authorization**: AUTHOR role only
**Cascade Order**:

1. **Progress Records** → Delete all user progress for lessons in course
2. **Quizzes** → Delete all quiz data for lessons
3. **Lessons** → Delete all lesson content
4. **Enrollments** → Remove all user enrollments
5. **Modules** → Delete course modules
6. **Course** → Finally delete the course itself

**Transaction Safety**: All deletions wrapped in database transaction for consistency

#### Lesson Deletion

**Authorization**: AUTHOR role only
**Cascade Order**:

1. **Progress Records** → Delete user progress for specific lesson
2. **Quiz Data** → Delete associated quiz (if exists)
3. **Lesson** → Delete lesson content

#### User Deletion

**Authorization**: ADMIN/Author roles only
**Cascade Order**:

1. **Progress Records** → Delete all user progress
2. **Enrollments** → Remove all course enrollments
3. **NextAuth Sessions** → Clean up authentication sessions
4. **User Account** → Delete user record

#### Quiz Question Deletion

**Authorization**: AUTHOR role only
**Process**: Direct deletion with confirmation dialog

### Confirmation Dialogs

All delete operations require user confirmation:

- **Course Deletion**: "Are you sure you want to delete [Course Name]? This action cannot be undone."
- **Lesson Deletion**: "Are you sure you want to delete [Lesson Name]? This action cannot be undone."
- **User Deletion**: "Are you sure you want to delete [User Name]? This action cannot be undone."
- **Quiz Question Deletion**: "Are you sure you want to delete this question? This action cannot be undone."

### Data Integrity

- **Foreign Key Constraints**: Database enforces referential integrity
- **Transaction Rollback**: Failed deletions automatically rollback
- **Orphan Prevention**: Cascade deletion prevents orphaned records
- **Audit Trail**: All operations logged for debugging

## Security Considerations

- All API routes protected with rate limiting
- Input validation on all endpoints
- CSRF protection enabled
- Secure session management
- Password hashing with bcrypt
- SQL injection prevention via Prisma

## Deployment

### Production Database

Update `DATABASE_URL` to PostgreSQL connection string:

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Environment Setup

1. Generate secure `NEXTAUTH_SECRET`
2. Configure `NEXTAUTH_URL` for production domain
3. Set up Upstash Redis for rate limiting
4. Configure file storage (Bunny Storage)

---

## Implementation Steps Completed

### Phase 1: Project Setup & Foundation

1. **Next.js 15 Setup** - App Router with TypeScript
2. **Database Schema** - Prisma with SQLite for development
3. **Authentication System** - NextAuth.js with JWT strategy
4. **UI Framework** - Tailwind CSS + shadcn/ui components
5. **Basic Routing** - Protected routes with middleware
6. **User Management** - Registration, login, role-based access

### Phase 2: Security Hardening

7. **Rate Limiting** - Upstash Redis with fallback system
8. **CSRF Protection** - Origin validation and token verification
9. **Secure Sessions** - HTTP-only cookies, SameSite policy
10. **Input Validation** - Zod schemas for all API endpoints
11. **Error Handling** - Centralized error management
12. **Password Security** - bcrypt hashing with policy enforcement

### Phase 3: Core Features

13. **Multi-Tenant Architecture** - Department-based data isolation
14. **Role-Based Access Control** - Author, Admin, Basic roles
15. **Course Management** - Modules, lessons, progress tracking
16. **Dashboard System** - Role-specific dashboards
17. **User Profiles** - Profile management and avatar system
18. **Department Reports** - Analytics and statistics

### Phase 4: Advanced Features

19. **Workspace Branding** - Dynamic theming and customization
20. **Testing Framework** - Vitest + Playwright setup
21. **API Documentation** - Comprehensive endpoint coverage
22. **Error Recovery** - JWT session error handling
23. **Cookie Management** - Automatic cleanup and validation
24. **Production Readiness** - Environment configuration and deployment setup

### Current Status

- ✅ **Authentication**: Fully functional with secure sessions
- ✅ **Database**: SQLite development, PostgreSQL production-ready
- ✅ **Security**: Rate limiting, CSRF, input validation
- ✅ **UI/UX**: Modern interface with branding system
- ✅ **Progress Tracking**: Standardized progress calculation utilities
- ✅ **Quiz System**: Complete quiz functionality with retry mechanism
- ✅ **Dashboard System**: Real-time progress updates across all dashboards
- ✅ **Department Management**: Individual user progress tracking
- ✅ **Course Management**: Full CRUD operations with cascade deletion
- ✅ **Testing**: Unit and e2e test framework
- ✅ **Documentation**: Comprehensive README and API docs

**Ready for production deployment and user testing.**
