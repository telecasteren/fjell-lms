import { prisma } from "./prisma";
import { Role, CourseStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

/**
 * Check if a department is the main FOX-LMS department
 */
export function isMainDepartment(departmentName: string): boolean {
  return departmentName === "FOX-LMS";
}

/**
 * Get accessible department IDs for a user based on their role and department hierarchy
 * - AUTHOR: Returns null (can access all departments)
 * - WRITER: Returns array with only their department ID
 * - ADMIN: Returns array with their department ID and all sub-departments (child departments can see their own and sub-departments)
 * - BASIC: Returns array with only their department ID
 */
export async function getAccessibleDepartmentIds(
  userId: string
): Promise<string[] | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          parentDepartmentId: true,
        },
      },
    },
  });

  if (!user) return null;

  // AUTHOR can access all departments
  if (user.role === Role.AUTHOR) {
    return null; // null means "all departments"
  }

  // WRITER can only access their own department
  if (user.role === Role.WRITER) {
    return user.departmentId ? [user.departmentId] : [];
  }

  // ADMIN can access their own department and all sub-departments
  if (user.role === Role.ADMIN) {
    if (!user.departmentId) return [];

    // Get all sub-departments recursively
    const departmentIds = [user.departmentId];
    const getSubDepartments = async (deptId: string) => {
      const subDepts = await prisma.department.findMany({
        where: { parentDepartmentId: deptId },
        select: { id: true },
      });

      for (const subDept of subDepts) {
        departmentIds.push(subDept.id);
        await getSubDepartments(subDept.id); // Recursively get nested sub-departments
      }
    };

    await getSubDepartments(user.departmentId);
    return departmentIds;
  }

  // BASIC can only access their own department
  if (user.role === Role.BASIC) {
    return user.departmentId ? [user.departmentId] : [];
  }

  return [];
}

/**
 * Build a Prisma where clause for filtering departments based on user role and hierarchy
 * Returns an object that can be used directly in Prisma queries
 */
export async function getDepartmentWhereClause(
  userId: string
): Promise<{ id?: { in: string[] } } | Record<string, never>> {
  const departmentIds = await getAccessibleDepartmentIds(userId);

  // null means AUTHOR can access all departments
  if (departmentIds === null) {
    return {} as Record<string, never>;
  }

  // Empty array means no access
  if (departmentIds.length === 0) {
    return { id: { in: [] } }; // This will return no results
  }

  return { id: { in: departmentIds } };
}

/**
 * Build a Prisma where clause for filtering courses based on user role and department hierarchy
 * Returns an object that can be used directly in Prisma queries
 */
export async function getCourseWhereClause(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _includeStatusFilter: boolean = false
): Promise<Prisma.CourseWhereInput> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      departmentId: true,
      department: {
        select: {
          parentDepartmentId: true,
        },
      },
    },
  });

  if (!user) {
    return { id: { in: [] } }; // No access
  }

  let whereClause: Prisma.CourseWhereInput = {};

  if (user.role === Role.AUTHOR) {
    // AUTHOR sees ALL courses (platform-wide) - no status filter so they can manage their drafts
    whereClause = {};
  } else if (user.role === Role.WRITER || user.role === Role.ADMIN) {
    // Content creators see:
    // 1. All courses from their own department (regardless of status)
    // 2. Published courses from parent department
    // 3. Global published courses from any department
    const departmentIds = user.departmentId ? [user.departmentId] : [];
    if (user.department?.parentDepartmentId) {
      departmentIds.push(user.department.parentDepartmentId);
    }

    whereClause = {
      OR: [
        // Own department courses (all statuses)
        {
          departmentId: user.departmentId,
        },
        // Parent department published courses
        user.department?.parentDepartmentId
          ? {
              departmentId: user.department.parentDepartmentId,
              status: CourseStatus.PUBLISHED,
            }
          : {},
        // Global published courses
        {
          global: true,
          status: CourseStatus.PUBLISHED,
        },
      ].filter((condition) => Object.keys(condition).length > 0),
    };
  } else if (user.role === Role.BASIC) {
    // BASIC users see:
    // 1. Published courses from their department
    // 2. Published courses from parent department
    // 3. Global published courses
    const departmentIds = user.departmentId ? [user.departmentId] : [];
    if (user.department?.parentDepartmentId) {
      departmentIds.push(user.department.parentDepartmentId);
    }

    whereClause = {
      OR: [
        // Department courses (published only)
        {
          departmentId: {
            in: departmentIds,
          },
          status: CourseStatus.PUBLISHED,
        },
        // Global published courses
        {
          global: true,
          status: CourseStatus.PUBLISHED,
        },
      ],
    };
  } else {
    // No access for unknown roles
    whereClause = { id: { in: [] } };
  }

  return whereClause;
}

/**
 * Check if a user can access a course based on their role and department
 * - AUTHOR: Can access any course
 * - WRITER: Can access all courses from their own department, published courses from parent department
 * - ADMIN: Can access all courses from their own department, published courses from parent department
 * - BASIC: Can access published courses from their department and parent department
 */
export async function canAccessCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      departmentId: true,
      department: {
        select: {
          parentDepartmentId: true,
        },
      },
    },
  });

  if (!user) return false;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      departmentId: true,
      status: true,
      global: true,
    },
  });

  if (!course) return false;

  // AUTHOR can access any course
  if (user.role === Role.AUTHOR) {
    return true;
  }

  // Check if it's a global published course - accessible to all users
  if (course.global && course.status === CourseStatus.PUBLISHED) {
    return true;
  }

  // WRITER can access all courses from their own department (DRAFT, PUBLISHED, ARCHIVED)
  // but only published courses from parent department
  if (user.role === Role.WRITER || user.role === Role.ADMIN) {
    const departmentIds = [user.departmentId];
    if (user.department?.parentDepartmentId) {
      departmentIds.push(user.department.parentDepartmentId);
    }

    // If course is from their own department, allow access regardless of status
    if (course.departmentId === user.departmentId) {
      return true;
    }

    // For other departments (e.g., parent), only allow published courses
    return (
      departmentIds.includes(course.departmentId) &&
      course.status === CourseStatus.PUBLISHED
    );
  }

  // BASIC can only access published courses from their department and parent department
  if (user.role === Role.BASIC) {
    if (course.status !== CourseStatus.PUBLISHED) return false;

    const departmentIds = [user.departmentId];
    if (user.department?.parentDepartmentId) {
      departmentIds.push(user.department.parentDepartmentId);
    }

    return departmentIds.includes(course.departmentId);
  }

  return false;
}

/**
 * Check if a user can manage a course (create/edit/delete)
 * - AUTHOR: Can manage any course (including global courses)
 * - WRITER: Can only manage courses from their own department
 * - ADMIN: Can only manage courses from their own department
 * Note: Only AUTHORs can set/unset the global flag
 */
export async function canManageCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      departmentId: true,
    },
  });

  if (!user) return false;

  // AUTHOR can manage any course
  if (user.role === Role.AUTHOR) {
    return true;
  }

  // WRITER and ADMIN can only manage courses from their own department
  if (user.role === Role.WRITER || user.role === Role.ADMIN) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { departmentId: true },
    });

    if (!course) return false;
    return course.departmentId === user.departmentId;
  }

  return false;
}

/**
 * Check if a user can manage a module (through course access)
 */
export async function canManageModule(
  userId: string,
  moduleId: string
): Promise<boolean> {
  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });

  if (!courseModule) return false;

  return canManageCourse(userId, courseModule.courseId);
}

/**
 * Check if a user can manage a lesson (through course access)
 */
export async function canManageLesson(
  userId: string,
  lessonId: string
): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      module: {
        select: { courseId: true },
      },
    },
  });

  if (!lesson) return false;

  return canManageCourse(userId, lesson.module.courseId);
}

/**
 * Check if a user's department is a child of FOX-LMS (or is FOX-LMS itself)
 * Returns true if the user is in FOX-LMS or any child department of FOX-LMS
 * Traverses up the parent chain to find FOX-LMS
 */
export async function isInChildDepartmentOfFoxLms(
  userId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      department: {
        select: {
          id: true,
          name: true,
          parentDepartmentId: true,
        },
      },
    },
  });

  if (!user || !user.department) return false;

  // If user is in FOX-LMS itself, return true
  if (user.department.name === "FOX-LMS") {
    return true;
  }

  // Traverse up the parent chain to find FOX-LMS
  let currentDepartmentId = user.department.parentDepartmentId;

  while (currentDepartmentId) {
    const parentDept = await prisma.department.findUnique({
      where: { id: currentDepartmentId },
      select: {
        id: true,
        name: true,
        parentDepartmentId: true,
      },
    });

    if (!parentDept) break;

    // Found FOX-LMS in the chain
    if (parentDept.name === "FOX-LMS") {
      return true;
    }

    // Move up to next parent
    currentDepartmentId = parentDept.parentDepartmentId;
  }

  return false;
}
