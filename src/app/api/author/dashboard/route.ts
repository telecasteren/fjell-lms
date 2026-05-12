import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("author:access", req);

    // Get overall statistics
    const totalUsers = await prisma.user.count();
    const totalDepartments = await prisma.department.count();
    const totalCourses = await prisma.course.count();

    // Calculate average completed courses per user without N+1 queries.
    // A course is considered completed for a user if they have completed progress records
    // for all lessons in that course.
    const enrollments = await prisma.enrollment.findMany({
      select: { userId: true, courseId: true },
    });

    const uniqueCourseIds = Array.from(
      new Set(enrollments.map((e) => e.courseId)),
    );

    // Total lessons per course (sum of module lesson counts)
    const coursesWithLessonCounts = await prisma.course.findMany({
      where: { id: { in: uniqueCourseIds } },
      select: {
        id: true,
        modules: {
          select: {
            _count: { select: { lessons: true } },
          },
        },
      },
    });

    const totalLessonsByCourseId = new Map<string, number>();
    for (const course of coursesWithLessonCounts) {
      const totalLessonsForCourse = course.modules.reduce(
        (acc, m) => acc + m._count.lessons,
        0,
      );
      totalLessonsByCourseId.set(course.id, totalLessonsForCourse);
    }

    // Completed lessons per (userId, courseId)
    const completedProgressRows = await prisma.progress.findMany({
      where: {
        completed: true,
        lesson: {
          module: {
            courseId: { in: uniqueCourseIds },
          },
        },
      },
      select: {
        userId: true,
        lesson: { select: { module: { select: { courseId: true } } } },
      },
    });

    const completedLessonsByUserCourse = new Map<string, number>();
    for (const row of completedProgressRows) {
      const courseId = row.lesson.module.courseId;
      const key = `${row.userId}:${courseId}`;
      completedLessonsByUserCourse.set(
        key,
        (completedLessonsByUserCourse.get(key) || 0) + 1,
      );
    }

    const completedCoursesByUserId = new Map<string, number>();
    for (const enrollment of enrollments) {
      const totalLessonsForCourse =
        totalLessonsByCourseId.get(enrollment.courseId) || 0;
      if (totalLessonsForCourse === 0) continue;
      const completedLessonsForUserCourse =
        completedLessonsByUserCourse.get(
          `${enrollment.userId}:${enrollment.courseId}`,
        ) || 0;
      if (completedLessonsForUserCourse >= totalLessonsForCourse) {
        completedCoursesByUserId.set(
          enrollment.userId,
          (completedCoursesByUserId.get(enrollment.userId) || 0) + 1,
        );
      }
    }

    const totalCompletedCoursesAcrossUsers = Array.from(
      completedCoursesByUserId.values(),
    ).reduce((a, b) => a + b, 0);

    const averageCompletedCourses =
      totalUsers > 0
        ? Math.round((totalCompletedCoursesAcrossUsers / totalUsers) * 10) / 10
        : 0;

    // Get all departments with detailed progress info and hierarchy
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        parentDepartmentId: true,
        parentDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
        subDepartments: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                users: true,
                courses: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const departmentIds = departments.map((d) => d.id);

    // Total lessons per department (sum of module lesson counts for courses in the department)
    const coursesForDepartments = await prisma.course.findMany({
      where: { departmentId: { in: departmentIds } },
      select: {
        departmentId: true,
        modules: { select: { _count: { select: { lessons: true } } } },
      },
    });

    const totalLessonsByDepartmentId = new Map<string, number>();
    for (const course of coursesForDepartments) {
      const lessonCount = course.modules.reduce(
        (acc, m) => acc + m._count.lessons,
        0,
      );
      totalLessonsByDepartmentId.set(
        course.departmentId,
        (totalLessonsByDepartmentId.get(course.departmentId) || 0) +
          lessonCount,
      );
    }

    // Completed lessons per department, scoped to:
    // - users belonging to the department
    // - lessons belonging to courses in the same department
    const completedDeptProgressRows = await prisma.progress.findMany({
      where: {
        completed: true,
        user: { departmentId: { in: departmentIds } },
        lesson: { module: { course: { departmentId: { in: departmentIds } } } },
      },
      select: {
        user: { select: { departmentId: true } },
        lesson: {
          select: {
            module: { select: { course: { select: { departmentId: true } } } },
          },
        },
      },
    });

    const completedLessonsByDepartmentId = new Map<string, number>();
    for (const row of completedDeptProgressRows) {
      const userDeptId = row.user.departmentId;
      const courseDeptId = row.lesson.module.course.departmentId;
      if (userDeptId !== courseDeptId) continue;
      completedLessonsByDepartmentId.set(
        userDeptId,
        (completedLessonsByDepartmentId.get(userDeptId) || 0) + 1,
      );
    }

    const departmentsWithProgress = departments.map((dept) => {
      const totalLessons = totalLessonsByDepartmentId.get(dept.id) || 0;
      const completedLessons = completedLessonsByDepartmentId.get(dept.id) || 0;
      const userCount = dept._count.users;

      const completionRate =
        totalLessons > 0 && userCount > 0
          ? Math.round((completedLessons / (totalLessons * userCount)) * 100)
          : 0;

      return {
        id: dept.id,
        name: dept.name,
        parentDepartmentId: dept.parentDepartmentId || null,
        parentDepartment: dept.parentDepartment || null,
        subDepartments: dept.subDepartments || [],
        _count: dept._count,
        progress: {
          totalLessons,
          completedLessons,
          completionRate,
        },
      };
    });

    return NextResponse.json({
      overallStats: {
        totalUsers,
        totalDepartments,
        totalCourses,
        averageCompletedCourses,
      },
      departments: departmentsWithProgress,
    });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      const message = (error as { message?: string }).message || "Unauthorized";
      console.error("Author dashboard AuthError:", { status, message, error });
      return NextResponse.json({ error: message }, { status });
    }
    console.error("Author dashboard error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Author dashboard error details:", {
      errorMessage,
      errorStack,
    });
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
