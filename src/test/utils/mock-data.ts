// Mock data for testing
export const mockDepartments = [
  {
    id: "1",
    name: "Department 1",
    createdAt: "2024-01-01T00:00:00Z",
    _count: {
      users: 5,
      courses: 3,
    },
  },
  {
    id: "2",
    name: "Engineering",
    createdAt: "2024-01-02T00:00:00Z",
    _count: {
      users: 8,
      courses: 5,
    },
  },
  {
    id: "3",
    name: "Marketing",
    createdAt: "2024-01-03T00:00:00Z",
    _count: {
      users: 3,
      courses: 2,
    },
  },
];

export const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "BASIC",
    departmentId: "1",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "ADMIN",
    departmentId: "1",
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "AUTHOR",
    departmentId: "2",
    createdAt: "2024-01-03T00:00:00Z",
  },
];

export const mockCourses = [
  {
    id: "1",
    title: "Introduction to LMS",
    description: "Learn the basics of our Learning Management System",
    status: "PUBLISHED",
    departmentId: "1",
    createdAt: "2024-01-01T00:00:00Z",
    modules: [
      {
        id: "1",
        title: "Getting Started",
        courseId: "1",
        lessons: [
          {
            id: "1",
            title: "Welcome",
            content: "Welcome to the course!",
            moduleId: "1",
          },
          {
            id: "2",
            title: "Navigation",
            content: "Learn how to navigate the system",
            moduleId: "1",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Advanced Features",
    description: "Explore advanced LMS features",
    status: "DRAFT",
    departmentId: "1",
    createdAt: "2024-01-02T00:00:00Z",
    modules: [],
  },
];

export const mockModules = [
  {
    id: "1",
    title: "Getting Started",
    courseId: "1",
    lessons: [
      {
        id: "1",
        title: "Welcome",
        content: "Welcome to the course!",
        moduleId: "1",
      },
      {
        id: "2",
        title: "Navigation",
        content: "Learn how to navigate the system",
        moduleId: "1",
      },
    ],
  },
  {
    id: "2",
    title: "Advanced Topics",
    courseId: "1",
    lessons: [
      {
        id: "3",
        title: "Advanced Navigation",
        content: "Advanced navigation techniques",
        moduleId: "2",
      },
    ],
  },
];

export const mockLessons = [
  {
    id: "1",
    title: "Welcome",
    content: "Welcome to the course!",
    moduleId: "1",
  },
  {
    id: "2",
    title: "Navigation",
    content: "Learn how to navigate the system",
    moduleId: "1",
  },
  {
    id: "3",
    title: "Advanced Navigation",
    content: "Advanced navigation techniques",
    moduleId: "2",
  },
];

export const mockQuizzes = [
  {
    id: "1",
    title: "Welcome Quiz",
    description: "Test your knowledge of the welcome lesson",
    lessonId: "1",
    questions: [
      {
        id: "1",
        question: "What is the main purpose of this course?",
        options: [
          { id: "1", text: "To learn the basics", isCorrect: true },
          { id: "2", text: "To learn advanced features", isCorrect: false },
          { id: "3", text: "To pass an exam", isCorrect: false },
        ],
      },
    ],
  },
];

export const mockEnrollments = [
  {
    id: "1",
    userId: "1",
    courseId: "1",
    enrolledAt: "2024-01-01T00:00:00Z",
    user: mockUsers[0],
    course: mockCourses[0],
  },
  {
    id: "2",
    userId: "2",
    courseId: "1",
    enrolledAt: "2024-01-02T00:00:00Z",
    user: mockUsers[1],
    course: mockCourses[0],
  },
];

export const mockProgress = [
  {
    id: "1",
    userId: "1",
    lessonId: "1",
    completed: true,
    completedAt: "2024-01-01T12:00:00Z",
  },
  {
    id: "2",
    userId: "1",
    lessonId: "2",
    completed: false,
    completedAt: null,
  },
];

export const mockDashboardData = {
  totalUsers: 16,
  totalDepartments: 3,
  totalCourses: 10,
  avgCompletedCoursesPerUser: 2.5,
  departments: mockDepartments,
};

export const mockAuthorDashboardData = {
  totalUsers: 16,
  totalDepartments: 3,
  totalCourses: 10,
  avgCompletedCoursesPerUser: 2.5,
  departments: mockDepartments,
};

export const mockDepartmentReports = [
  {
    id: "1",
    name: "Department 1",
    userCount: 5,
    courseCount: 3,
    totalLessons: 15,
    completedLessons: 8,
    completionRate: 53.33,
    users: mockUsers.filter((u) => u.departmentId === "1"),
    courses: mockCourses.filter((c) => c.departmentId === "1"),
  },
];

// Helper functions to create test data
export const createMockUser = (overrides = {}) => ({
  id: "1",
  name: "Test User",
  email: "test@example.com",
  role: "BASIC",
  departmentId: "1",
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockCourse = (overrides = {}) => ({
  id: "1",
  title: "Test Course",
  description: "A test course",
  status: "DRAFT",
  departmentId: "1",
  createdAt: "2024-01-01T00:00:00Z",
  modules: [],
  ...overrides,
});

export const createMockDepartment = (overrides = {}) => ({
  id: "1",
  name: "Test Department",
  createdAt: "2024-01-01T00:00:00Z",
  _count: {
    users: 0,
    courses: 0,
  },
  ...overrides,
});

export const createMockModule = (overrides = {}) => ({
  id: "1",
  title: "Test Module",
  courseId: "1",
  lessons: [],
  ...overrides,
});

export const createMockLesson = (overrides = {}) => ({
  id: "1",
  title: "Test Lesson",
  content: "Test lesson content",
  moduleId: "1",
  ...overrides,
});

export const createMockQuiz = (overrides = {}) => ({
  id: "1",
  title: "Test Quiz",
  description: "A test quiz",
  lessonId: "1",
  questions: [],
  ...overrides,
});
