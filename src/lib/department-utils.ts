import { prisma } from "./prisma";
import { Role } from "@prisma/client";
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
 * - ADMIN/BASIC: Returns array with only their department ID (child departments can only see their own)
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

  // ADMIN/BASIC can only access their own department (child departments can only see their own)
  if (user.role === Role.ADMIN || user.role === Role.BASIC) {
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
  includeStatusFilter: boolean = false
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
    // AUTHOR sees ALL courses (platform-wide)
    whereClause = {};
  } else if (user.role === Role.WRITER) {
    // WRITER sees only courses from their own department
    whereClause = {
      departmentId: user.departmentId,
    };
  } else if (user.role === Role.ADMIN || user.role === Role.BASIC) {
    // ADMIN/BASIC see published courses from their department and parent department
    const departmentIds = user.departmentId ? [user.departmentId] : [];
    if (user.department?.parentDepartmentId) {
      departmentIds.push(user.department.parentDepartmentId);
    }
    
    whereClause = {
      departmentId: {
        in: departmentIds,
      },
    };
    
    if (includeStatusFilter) {
      whereClause.status = "PUBLISHED";
    }
  } else {
    // No access for unknown roles
    whereClause = { id: { in: [] } };
  }

  return whereClause;
}

/**
 * Check if a user can access a course based on their role and department
 * - AUTHOR: Can access any course
 * - WRITER: Can only access courses from their own department
 * - ADMIN/BASIC: Can access published courses from their department and parent department
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
    },
  });

  if (!course) return false;

  // AUTHOR can access any course
  if (user.role === Role.AUTHOR) {
    return true;
  }

  // WRITER can only access courses from their own department
  if (user.role === Role.WRITER) {
    return course.departmentId === user.departmentId;
  }

  // ADMIN/BASIC can access published courses from their department and parent department
  if (user.role === Role.ADMIN || user.role === Role.BASIC) {
    if (course.status !== "PUBLISHED") return false;
    
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
 * - AUTHOR: Can manage any course
 * - WRITER: Can only manage courses from their own department
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

  // WRITER can only manage courses from their own department
  if (user.role === Role.WRITER) {
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

