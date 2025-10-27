# Plan for a LMS web application

### Tech stack

- Next.js 14+ (App Router) + TypeScript
- react-hook-form
- react-hot-toast
- Tailwind CSS
- shadcn/ui
- Vitest (unit) and Playwright (end-to-end)
- Database: PostgreSQL + Prisma
- File Storage & CDN: Bunny Storage + Bunny CDN
- Deployment: Vercel (preferred), Netlify or Render


- Styles
    - Tailwind for CSS
    - shadcn components
    - Colours:
        - #1b283c - main brand
        - #273A57 - sub brand
        - #d8d8d8 - background
        - #ffffff - content container background + text on dark backgrounds
        - #000000 - text on light backgrounds
    - Theme:
        - Light and dark modes supported
        - Colours listed above are for the light theme
        - Dark theme derives from light palette with accessible contrast
        - Use Tailwind dark variant (class strategy) for theming
    - Borders on content containers:
        - rounded-sm
        - transparent
        - box-shadows
- Tests
    - Vitest for unit testing
    - Playwright for end to end testing
 

## Workspace structure:

Should be centralised for easy maintenance and branding:

- Logos
- Links
- Colours
- Fonts

---

### Background of the typical user

This LMS will be used by adults aged 20–60. Many may not spend much time with computers or modern applications, so the app must accommodate typical workers in fire prevention departments, electrical grid companies, etc.

---

### User story (basic user)

I am a new user to this LMS app. I go to the web application and login my user with the form. In the form, I added name, email address and a strong password and clicked Login. → the system then navigated me to my dashboard. At the dashboard I get an overview of these things in the main window:

- Ongoing courses (hidden list, toggle to open).
- Statistics in cake diagram with colours of how much of the material I’ve finished.

**The dashboard** has a sidebar that I can toggle the visibility of, and inside the sidebar:

- Button: **Courses** (toggles main window content):
    - Content is a list of all available courses on the platform.
- Button: **My dashboard** (toggles main window content).
- Link: **Profile** with avatar circle image. Hovering this element displays user email in pop over, clicking the element toggles main window content to show:
    - User information:
        - Name, Email, Role, Department, Overall % of completion out of all courses. Something like **20% - 2/10 courses.**

---

## Features

- Dashboard with overview per logged in user:
    - My courses list.
    - Current ongoing course in focus.
    - Dynamic status percentage per started course, ex: a coloured status bar showing 20% completed of 100% and the number 20% beside it.
    - Coloured cake diagram showing statistics on:
        - All courses - Ongoing courses - Completed courses.
- Sidebar with navigation links/buttons to:
    - All courses
    - My ongoing courses
    - My profile (Avatar link and name appear on hover)
    - Settings: allow each user to change registered email/password and toggle light/dark theme

### Authentication

- Email/password with simple email validation
- Any domain can register
- Only a user with Author role can grant Author permissions to others
- Sessions: start simple (JWT or database sessions, to be decided later), changeable later

### Multi-tenancy and departments

- Single application with multiple departments (tenants)
- Users and data are scoped to their department; cross-department access is not allowed
- A user can belong to only one department at a time
- Re-association flow: if a user is deleted in one department, an Admin in another department can create a new user for them using the same email; the user logs in via landing page and starts fresh in the new department

### Courses and content structure

- Course hierarchy:
    - Module
        - Lesson
            - Quiz (optional per lesson)
        - Lesson
            - Quiz
        - Lesson
            - Quiz
    
### Progress and assessments

- Progress computed by lesson completion
- Quiz type: multi-select
- Quiz policy: optional for users; pass/not passed with try again

### RBAC actions

- Author: create/edit/publish/archive courses; enroll users; delete users; view all departments' reports
- Admin: enroll users; view department-wide reports
- Basic: update own settings (name, email, language, theme); take courses; view own dashboard/report

### Dashboard and reporting

- Out of scope for this iteration; keep listed for later implementation

### User management and enrollment

- Enrollment: self-serve via landing page login/register OR invited via link by a department Admin
- The invite link can be the same as the landing page URL; users authenticate through the landing page

### Branding and i18n

- Languages: Norwegian (default) with English switchable in user profile settings
- Theme: light as default; user can toggle to dark mode in settings

### Deployment and operations

- Exclude deployment setup in this iteration; app should run locally for now

### Testing focus

- Priority area: Authentication

### Future scope

- No payments logic required now; application will be covered by external license cost

## Data storage

- User:
    - UserList: Id, Name, Email, Role, Department.
    - Courses per user and completion rate per user.
- Department:
    - UserList
    - Courses
    - Department completion rate (calculated by related users completion rate)

## User management

- 3 types of roles:
    - **Author** - full authority over whole solution, all the registered departments, users and user-roles. Dashboard is a admin panel where the Author can switch between viewing each departments dashboard view.
    - **Admin user** - can change settings for its own department and give/take user roles from basic users/admin users (Author role take precedence, i.e. admin users are below Author level). Dashboard is an overview of the entire departments courses, and can change dashboard view to a specific user in their own department.
    - **Basic user** - has read abilities within its own department, can take courses and see their own courses on their own dashboard. Cannot see other users info or department dashboard.