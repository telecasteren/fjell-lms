# 🏗️ LMS Project Ecosystem Architecture

## **Core Technology Stack**

### **1. Frontend Layer**

- **Next.js 15** (App Router) - React framework with server-side rendering
- **React 19** - UI library for building components
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Pre-built accessible UI components (built on Radix UI)

### **2. Backend Layer**

- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication framework
- **Prisma** - Database ORM and query builder

### **3. Database Layer**

- **SQLite** (Development) - Local file-based database
- **PostgreSQL** (Production) - Production database (via Neon)

### **4. External Services**

- **Upstash Redis** - Rate limiting and caching
- **Neon** - PostgreSQL hosting (production)
- **Bunny Storage** - Cloud storage for multimedia files
- **Bunny CDN** - Content delivery network with Pull Zones

---

## **🔄 Data Flow & Relationships**

### **Authentication Flow**

```
User Login → NextAuth.js → Prisma → Database
     ↓
JWT Token → Session Management → RBAC Check
```

**Components:**

- **NextAuth.js** handles authentication with JWT strategy
- **Prisma** validates credentials against database
- **bcrypt** hashes/stores passwords securely
- **Session tokens** stored in HTTP-only cookies

### **Database Architecture**

```
Prisma Schema → Database Tables
     ↓
Department → Users → Courses → Modules → Lessons → Quizzes
     ↓
Enrollments, Progress, QuizCompletions (Junction Tables)
```

**Key Relationships:**

- **Multi-tenancy**: Data scoped by `departmentId`
- **RBAC**: Users have roles (AUTHOR, ADMIN, BASIC)
- **Course Structure**: Hierarchical (Course → Module → Lesson → Quiz)
- **Content Types**: Lessons support multiple content formats (Text, SCORM, Multimedia)
- **Progress Tracking**: Junction tables for enrollments and completions
- **Department Branding**: Custom logos and text per department (optional)

### **API Request Flow**

```
Client Request → Rate Limiting → Authentication → RBAC → Business Logic → Database → Response
```

**Rate Limiting (Upstash Redis):**

- **Auth endpoints**: 5 requests/minute
- **Registration**: 3/hour
- **Admin operations**: 10/hour
- **Course operations**: 20/minute
- **Reports**: 5/minute

---

## **🛡️ Security Architecture**

### **Multi-Layer Security**

1. **Rate Limiting** (Upstash Redis)
2. **CSRF Protection** (NextAuth)
3. **Input Validation** (Zod schemas)
4. **RBAC** (Role-based access control)
5. **Secure Sessions** (JWT + HTTP-only cookies)

### **Authorization Flow**

```
Request → getCurrentUser() → requireRole() → Business Logic
```

**RBAC Functions:**

- `requireAuth()` - Any authenticated user
- `requireAuthor()` - AUTHOR role only
- `requireAdminOrAuthor()` - ADMIN or AUTHOR
- `requireBasicOrAbove()` - All roles

---

## **📊 Data Management**

### **Prisma ORM Benefits**

- **Type Safety**: Auto-generated TypeScript types
- **Query Builder**: Type-safe database queries
- **Migrations**: Schema versioning
- **Connection Pooling**: Efficient database connections

### **Database Schema Highlights**

- **Multi-tenancy**: All data scoped by department
- **Audit Trail**: `createdAt`, `updatedAt` timestamps
- **Soft Relationships**: Cascade deletes for data integrity
- **JSON Storage**: Quiz questions stored as JSON for flexibility
- **Content Flexibility**: Lesson content supports multiple formats (Text, SCORM, Multimedia)
- **Extensible Design**: Content type system ready for future content formats
- **Department Branding**: Optional custom logos and text per department

---

## **🚀 Deployment Architecture**

### **Development Environment**

```
Next.js Dev Server → SQLite Database → Local Redis (optional)
```

### **Production Environment**

```
Vercel/Netlify → Neon PostgreSQL → Upstash Redis → Bunny Storage/CDN
```

**Environment Variables:**

- `DATABASE_URL` - Database connection
- `NEXTAUTH_SECRET` - JWT signing key
- `NEXTAUTH_URL` - Application URL
- `UPSTASH_REDIS_REST_URL` - Redis connection
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication
- `BUNNY_STORAGE_API_KEY` - Bunny Storage API key
- `BUNNY_STORAGE_BUCKET` - Storage zone name
- `BUNNY_STORAGE_REGION` - Storage region code

---

## **🔧 Key Integration Points**

### **NextAuth.js ↔ Prisma**

- **Adapter**: `@auth/prisma-adapter` connects NextAuth to Prisma
- **Session Storage**: User sessions stored in database
- **JWT Strategy**: Stateless authentication with database validation

### **Prisma ↔ Database**

- **Connection**: Single Prisma client instance
- **Query Optimization**: Automatic query optimization
- **Type Generation**: `prisma generate` creates TypeScript types

### **Upstash Redis ↔ Rate Limiting**

- **Distributed Limiting**: Redis enables rate limiting across multiple instances
- **Analytics**: Built-in usage analytics
- **Fallback**: In-memory rate limiting when Redis unavailable

### **Tailwind CSS ↔ shadcn/ui**

- **Design System**: Consistent component styling
- **Accessibility**: Built-in ARIA attributes
- **Theming**: Dark/light mode support

### **Bunny Storage ↔ File Management**

- **Storage API**: Native REST API for file uploads
- **CDN Delivery**: Pull Zone for optimized file serving
- **Cost-Effective**: $0.01/GB storage pricing
- **Global Distribution**: Files cached at edge locations worldwide
- **Automatic Cleanup**: Files deleted when lessons are deleted

---

## **📈 Performance Optimizations**

### **Database**

- **Connection Pooling**: Prisma manages connections efficiently
- **Query Optimization**: Prisma optimizes queries automatically
- **Indexing**: Database indexes on frequently queried fields

### **Caching**

- **Redis Caching**: Rate limiting data cached in Redis
- **Session Caching**: JWT tokens reduce database lookups
- **Static Generation**: Next.js static generation for public pages
- **CDN Caching**: Bunny CDN caches multimedia files at edge locations

### **Frontend**

- **Code Splitting**: Automatic code splitting by Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Optimization**: Tree shaking and minification

---

## **🔄 Development Workflow**

### **Local Development**

1. **Database**: `prisma migrate dev` - Run migrations
2. **Types**: `prisma generate` - Generate TypeScript types
3. **Development**: `npm run dev` - Start development server
4. **Testing**: `npm run test` - Run test suite

### **Production Deployment**

1. **Build**: `npm run build` - Create production build
2. **Database**: `prisma migrate deploy` - Deploy migrations
3. **Environment**: Set production environment variables
4. **Deploy**: Deploy to hosting platform

---

## **🎯 Key Benefits of This Architecture**

### **Scalability**

- **Serverless**: Next.js API routes scale automatically
- **Database**: Neon PostgreSQL handles scaling
- **Caching**: Redis reduces database load

### **Security**

- **Multi-layer**: Rate limiting, authentication, authorization
- **Type Safety**: TypeScript prevents runtime errors
- **Input Validation**: Zod schemas validate all inputs

### **Developer Experience**

- **Type Safety**: Full TypeScript coverage
- **Hot Reloading**: Fast development iteration
- **Error Handling**: Centralized error management
- **Testing**: Comprehensive test setup

### **Maintainability**

- **Modular**: Clear separation of concerns
- **Documentation**: Well-documented APIs and components
- **Standards**: Consistent coding patterns
- **Monitoring**: Built-in error tracking and analytics

---

## **📁 Project Structure**

```
web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── (auth)/            # Authentication pages
│   │   └── ...                # Other pages
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Database client
│   │   ├── rbac.ts           # Role-based access control
│   │   ├── rate-limit.ts     # Rate limiting with Redis
│   │   └── ...               # Other utilities
│   └── ...
├── prisma/
│   └── schema.prisma         # Database schema
├── DOCS/                     # Documentation
│   ├── Architecture.md       # This file
│   ├── SECURITY.md          # Security configuration
│   └── ...
└── ...
```

---

## **🔍 Technology Relationships Summary**

| Technology        | Purpose                    | Integration Point               |
| ----------------- | -------------------------- | ------------------------------- |
| **Next.js**       | Full-stack React framework | Core application framework      |
| **Prisma**        | Database ORM               | Database abstraction layer      |
| **NextAuth.js**   | Authentication             | User management & sessions      |
| **Upstash Redis** | Rate limiting              | API protection                  |
| **Tailwind CSS**  | Styling                    | UI component styling            |
| **shadcn/ui**     | UI Components              | Pre-built accessible components |
| **TypeScript**    | Type safety                | Development & runtime safety    |
| **Zod**           | Validation                 | Input validation schemas        |
| **bcrypt**        | Password hashing           | Secure password storage         |
| **Bunny Storage** | File storage               | Multimedia file storage & CDN   |

This architecture provides a robust, scalable, and secure foundation for the LMS application, with clear separation of concerns and excellent developer experience. The integration of Bunny Storage and CDN ensures fast, cost-effective multimedia delivery globally.
