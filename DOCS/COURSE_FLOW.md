# Course Flow & Progress Calculation Logic

This document explains the hierarchical structure of courses, modules, lessons, and quizzes, along with the progress calculation logic used throughout the LMS.

## 📚 Course Hierarchy

### Structure Overview

```
Course
├── Module 1
│   ├── Lesson 1
│   │   └── Quiz (optional)
│   ├── Lesson 2
│   │   └── Quiz (optional)
│   └── Lesson N
├── Module 2
│   ├── Lesson 1
│   └── Lesson N
└── Module N
```

### Database Relationships

```sql
Course (1) → (N) Module (1) → (N) Lesson (1) → (0..1) Quiz
```

## 🎯 Course Structure

### Course

- **Purpose**: Top-level container for learning content
- **Status**: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- **Access**: Department-scoped (AUTHORs see their department's courses)
- **Visibility**:
  - `PUBLISHED`: Visible to enrolled users
  - `ARCHIVED`: Hidden from BASIC/ADMIN users, visible to AUTHORs (greyed out)

### Module

- **Purpose**: Logical grouping of related lessons
- **Order**: Sequential progression through modules
- **Creation**: Auto-created with "Lesson 1" when module is added
- **Navigation**: "Add Module" button changes to "Next" after creation

### Lesson

- **Purpose**: Individual learning units within modules
- **Content Types**: Multiple content formats supported
  - **Text Editor**: Rich text content with textarea input
  - **SCORM**: SCORM package support (coming soon)
  - **Multimedia**: Video, audio, images, and interactive content with Bunny Storage integration
- **Content Selection**: Authors can choose content type via dropdown interface
- **File Storage**: Multimedia files stored in Bunny Storage with CDN delivery
- **File Preview**: Authors can preview uploaded multimedia before saving lessons
- **Cascade Deletion**: Files automatically deleted when lessons are deleted
- **Order**: Sequential within each module
- **Completion**: Marked complete when quiz is passed OR manually checked

### Quiz

- **Purpose**: Assessment tool for lesson comprehension
- **Structure**: Multiple choice questions with multiple correct answers
- **Pass Rate**: 70% required to pass
- **Attempts**: Unlimited retries tracked in database
- **Completion**: Lesson marked complete automatically when quiz is passed

## 📊 Progress Calculation Logic

### Lesson Progress

```typescript
// Current implementation in progress-utils.ts
export async function isLessonCompleted(
  userId: string,
  lessonId: string
): Promise<boolean> {
  // Check Progress table first
  const progress = await prisma.progress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (progress?.completed) return true;

  // Quiz completion automatically creates progress record
  // For now, just return based on progress table
  return false;
}
```

### Course Progress

```typescript
// Current implementation in progress-utils.ts
export async function calculateCourseProgress(
  userId: string,
  courseId: string
): Promise<{
  completedCount: number;
  totalCount: number;
  percentage: number;
}> {
  // Get all lessons for the course
  const lessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: courseId,
      },
    },
    select: { id: true },
  });

  if (lessons.length === 0) {
    return { completedCount: 0, totalCount: 0, percentage: 0 };
  }

  const lessonIds = lessons.map(l => l.id);
  const completionMap = await getLessonCompletions(userId, lessonIds);

  const completedCount = Object.values(completionMap).filter(Boolean).length;
  const totalCount = lessonIds.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return { completedCount, totalCount, percentage };
}
```

### User Progress Tracking

```typescript
// Progress table structure
Progress {
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt: DateTime;
}

// Quiz completion tracking
QuizCompletion {
  userId: string;
  quizId: string;
  passed: boolean;
  score: number; // Percentage
  attempts: number;
  completedAt: DateTime;
}
```

## 📝 Content Types & Management

### Content Type Selection

Authors can choose from multiple content types when creating or editing lessons:

1. **Text Editor** (Default)
   - Rich text content using textarea input
   - Supports markdown-style formatting
   - Immediate editing and preview

2. **SCORM** (Coming Soon)
   - SCORM package upload and integration
   - Standardized e-learning content
   - Progress tracking integration

3. **Multimedia** (Coming Soon)
   - Video, audio, and interactive content
   - File upload and streaming support
   - Interactive elements and assessments

### Content Type Interface

- **Dropdown Selection**: "Content type" dropdown with three options
- **Conditional Display**: Content input changes based on selected type
- **Future Extensibility**: Architecture supports additional content types
- **Backward Compatibility**: Existing text content remains unchanged

## 🔄 Learning Flow

### 1. Course Enrollment

```
User → Enrolls in Course → Access to Modules/Lessons
```

### 2. Lesson Progression

```
Start Course → Module 1 → Lesson 1 → Content (Text/SCORM/Multimedia) → Quiz (if exists)
                ↓
            Quiz Passed? → Yes → Lesson Complete → Next Lesson
                ↓
                No → Retake Quiz → Repeat until Passed
```

### 3. Module Completion

```
All Lessons in Module Complete → Module Complete → Next Module
```

### 4. Course Completion

```
All Modules Complete → Course Complete → Progress Updated
```

## 🎮 Quiz Flow & Logic

### Quiz Taking Process

1. **Start Quiz**: User clicks "Take Quiz" button
2. **Answer Questions**: Multiple choice with multiple correct answers
3. **Submit Quiz**: System calculates score and pass/fail status
4. **Results Display**: Shows correct/incorrect answers with explanations
5. **Completion Handling**:
   - **Passed**: Lesson automatically marked complete in Progress table, button shows "Quiz Passed"
   - **Failed**: Button shows "Retake Quiz", user can retry
6. **Database Updates**: Quiz completion saved to QuizCompletion table with attempt tracking

### Quiz Scoring Logic

```typescript
// Quiz scoring calculation
const calculateQuizScore = (questions, selectedAnswers) => {
  let correctCount = 0;

  questions.forEach(question => {
    const selected = selectedAnswers[question.id] || [];
    const isCorrect =
      selected.length === question.correctAnswers.length &&
      selected.every(answer => question.correctAnswers.includes(answer));

    if (isCorrect) correctCount++;
  });

  const percentage = Math.round((correctCount / questions.length) * 100);
  const passed = percentage >= 70; // 70% pass rate

  return { percentage, passed, correctCount };
};
```

### Quiz Button States

```typescript
// Current implementation in learn page
const getQuizButtonText = (lesson) => {
  if (!lesson.quiz) return null;

  if (!lesson.quizCompletion) {
    return "Take Quiz"; // First attempt
  }

  if (lesson.quizCompletion.passed) {
    return "Quiz Passed"; // Successfully completed
  }

  return "Retake Quiz"; // Failed, can retry
};

// Additional status display
if (lesson.quizCompletion) {
  return (
    <p className="text-xs text-muted-foreground mt-2">
      Attempts: {lesson.quizCompletion.attempts} |
      Status: {lesson.quizCompletion.passed ? "Passed" : "Failed"}
    </p>
  );
}
```

## 📈 Progress Tracking APIs

### Dashboard Progress

- **Endpoint**: `/api/dashboard`
- **Logic**: Uses `getLessonCompletions()` for standardized progress calculation
- **Returns**: Course stats, ongoing/completed courses, overall percentage
- **Access**: Only enrolled courses (not all department courses)

### Course Progress

- **Endpoint**: `/api/courses/[id]/progress`
- **Logic**: Uses `calculateCourseProgress()` utility function
- **Returns**: Lesson-by-lesson progress map, completion counts
- **Access**: Enrolled users or AUTHORs with course access

### Profile Progress

- **Endpoint**: `/api/profile`
- **Logic**: Uses `calculateOverallProgress()` utility function
- **Returns**: Total courses, completed courses, overall completion rate
- **Data**: Based on user's enrolled courses only

### Reports Progress

- **Endpoint**: `/api/reports/departments`
- **Logic**: Uses `calculateOverallProgress()` for each user
- **Returns**: Individual user progress, course completion rates, department stats
- **Access**: AUTHORs see all departments, ADMIN/BASIC see only their department

### Admin Department Stats

- **Endpoint**: `/api/admin/department-stats`
- **Logic**: Uses `calculateOverallProgress()` for individual user progress
- **Returns**: Department stats with detailed user progress information
- **Access**: ADMIN/Author roles only

## 🔄 Real-time Updates

### Progress Refresh Mechanism

```typescript
// Dashboard refresh hook
const useDashboardRefresh = () => {
  const refreshAllDashboards = useCallback(() => {
    // Dispatch custom event to notify all dashboard components
    window.dispatchEvent(new CustomEvent("dashboard-refresh"));

    // Trigger router refresh for server components
    router.refresh();
  }, [router]);
};
```

### Update Triggers

- **Quiz Completion**: Automatically refreshes all dashboards via `refreshAllDashboards()`
- **Manual Progress**: Updates course progress immediately
- **Course Completion**: Triggers department-wide progress updates
- **Dashboard Refresh**: Custom event `dashboard-refresh` notifies all components
- **Router Refresh**: Server components refreshed via `router.refresh()`

## 🎯 User Experience Flow

### For Learners (BASIC/ADMIN)

1. **Browse Courses**: See all published courses
2. **Enroll**: Click "Enroll" to join course
3. **Learn**: Access course content and take quizzes
4. **Track Progress**: See completion rates on dashboard
5. **Complete**: Finish lessons and courses

### For Authors (AUTHOR)

1. **Create Courses**: Build course structure with modules/lessons
2. **Add Content**: Write lesson content and create quizzes
3. **Manage**: Edit, delete, and maintain courses
4. **Monitor**: Track department progress and user engagement
5. **Report**: Generate progress reports for departments

## 📊 Progress Calculation Examples

### Example 1: Simple Course

```
Course: "Introduction to Programming"
├── Module 1: "Basics" (2 lessons)
│   ├── Lesson 1: "Variables" (Quiz: 80% pass)
│   └── Lesson 2: "Functions" (Quiz: 90% pass)
└── Module 2: "Advanced" (1 lesson)
    └── Lesson 3: "Objects" (No quiz)

Progress Calculation:
- Total Lessons: 3
- Completed Lessons: 2 (Lesson 1 passed, Lesson 2 passed, Lesson 3 not completed)
- Course Progress: 67% (2/3)
```

### Example 2: Complex Course

```
Course: "Web Development"
├── Module 1: "HTML" (3 lessons)
│   ├── Lesson 1: "Tags" (Quiz: 70% pass)
│   ├── Lesson 2: "Forms" (Quiz: 60% fail, 85% pass on retry)
│   └── Lesson 3: "Semantics" (No quiz, manually completed)
├── Module 2: "CSS" (2 lessons)
│   ├── Lesson 4: "Selectors" (Quiz: 90% pass)
│   └── Lesson 5: "Layout" (Quiz: 75% pass)
└── Module 3: "JavaScript" (1 lesson)
    └── Lesson 6: "Basics" (Quiz: 80% pass)

Progress Calculation:
- Total Lessons: 6
- Completed Lessons: 6 (All lessons completed)
- Course Progress: 100% (6/6)
- Quiz Attempts: 3 total (Lesson 2 had 2 attempts)
```

## 🔧 Technical Implementation

### Database Schema

```prisma
model Course {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      CourseStatus @default(DRAFT)
  departmentId String
  modules     Module[]
  enrollments Enrollment[]
}

model Module {
  id       String  @id @default(cuid())
  title    String
  order    Int
  courseId String
  course   Course  @relation(fields: [courseId], references: [id])
  lessons  Lesson[]
}

model Lesson {
  id       String  @id @default(cuid())
  title    String
  content  String?
  order    Int
  moduleId String
  module   Module  @relation(fields: [moduleId], references: [id])
  quiz     Quiz?
  progress Progress[]
}

model Quiz {
  id        String  @id @default(cuid())
  lessonId  String  @unique
  lesson    Lesson  @relation(fields: [lessonId], references: [id])
  questions Json
  completions QuizCompletion[]
}

model Progress {
  id         String   @id @default(cuid())
  userId     String
  lessonId   String
  completed  Boolean  @default(false)
  completedAt DateTime?
  user       User     @relation(fields: [userId], references: [id])
  lesson     Lesson   @relation(fields: [lessonId], references: [id])
}

model QuizCompletion {
  id        String  @id @default(cuid())
  userId    String
  quizId    String
  passed    Boolean
  score     Int
  attempts  Int     @default(1)
  completedAt DateTime @default(now())
  user      User    @relation(fields: [userId], references: [id])
  quiz      Quiz    @relation(fields: [quizId], references: [id])
}
```

### API Endpoints

- `GET /api/courses` - List courses with enrollment status
- `GET /api/courses/[id]/modules` - Get course modules
- `GET /api/modules/[id]/lessons` - Get module lessons with quiz completion data
- `GET /api/courses/[id]/progress` - Get course progress using standardized utilities
- `POST /api/progress` - Update lesson progress
- `POST /api/quiz-completion` - Save quiz results and auto-complete lesson
- `GET /api/quiz-completion` - Get quiz completion status
- `GET /api/dashboard` - Get user dashboard data with enrolled courses only
- `GET /api/profile` - Get user profile with progress stats using `calculateOverallProgress()`
- `GET /api/reports/departments` - Department analytics with individual user progress
- `GET /api/admin/department-stats` - Department statistics with user progress details
- `GET /api/author/dashboard` - Author dashboard with department progress
- `GET /api/author/departments/[id]` - Department details with progress calculations

## 🎯 Key Features

### Quiz Management

- **Multiple Attempts**: Unlimited retries with attempt tracking
- **Pass Rate**: 70% required to pass
- **Auto-completion**: Lesson marked complete when quiz passed
- **Progress Tracking**: Quiz completion status affects course progress

### Progress Calculation

- **Standardized Utilities**: All progress calculations use shared utility functions
- **Real-time Updates**: Progress updates immediately after quiz completion
- **Dashboard Refresh**: All dashboards refresh when progress changes via custom events
- **Consistent Logic**: Same calculation logic across all endpoints using `progress-utils.ts`
- **User-specific**: Progress calculated per user and course
- **Quiz Integration**: Quiz completion automatically creates progress records
- **Enrollment-based**: Progress calculated only for enrolled courses

### User Experience

- **Clear Feedback**: Button text reflects quiz completion status
- **Progress Visibility**: Completion rates shown throughout the app
- **Retry Mechanism**: Failed quizzes can be retaken
- **Completion Tracking**: Both manual and quiz-based completion supported

This comprehensive flow ensures that users can track their learning progress accurately while providing authors with the tools needed to create engaging educational content.
