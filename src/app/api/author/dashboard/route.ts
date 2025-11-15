import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";
import {
  calculateCourseProgress,
  calculateOverallProgress,
} from "@/lib/progress-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAuthorOnly(req);

    // Get overall statistics
    const totalUsers = await prisma.user.count();
    const totalDepartments = await prisma.department.count();
    const totalCourses = await prisma.course.count();

    // Calculate average completed courses per user
    const enrollments = await prisma.enrollment.findMany({
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    const userCourseCompletions = new Map<string, number>();

    for (const enrollment of enrollments) {
      const { completedCount, totalCount } = await calculateCourseProgress(
        enrollment.userId,
        enrollment.courseId,
      );

      if (totalCount > 0) {
        const isCompleted = completedCount >= totalCount;

        if (isCompleted) {
          const current = userCourseCompletions.get(enrollment.userId) || 0;
          userCourseCompletions.set(enrollment.userId, current + 1);
        }
      }
    }

    const completedCoursesArray = Array.from(userCourseCompletions.values());
    const averageCompletedCourses =
      completedCoursesArray.length > 0
        ? Math.round(
            (completedCoursesArray.reduce((a, b) => a + b, 0) /
              completedCoursesArray.length) *
              10,
          ) / 10
        : 0;

    // Get all departments with detailed progress info and hierarchy
    const departments = await prisma.department.findMany({
      include: {
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
        users: {
          select: { id: true },
        },
        courses: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate progress for each department
    type ModuleWithLessons = {
      lessons: Array<{ id: string }>;
    };

    type CourseWithModules = {
      modules: Array<ModuleWithLessons>;
    };

    type DepartmentWithData = {
      id: string;
      name: string;
      parentDepartmentId: string | null;
      parentDepartment: { id: string; name: string } | null;
      subDepartments: Array<{
        id: string;
        name: string;
        _count: { users: number; courses: number };
      }>;
      courses: Array<CourseWithModules>;
      users: Array<{ id: string }>;
    };

    const departmentsWithProgress = await Promise.all(
      departments.map(async (dept: DepartmentWithData) => {
        // Calculate total lessons in department
        const totalLessons = dept.courses.reduce(
          (acc: number, course: CourseWithModules) => {
            return (
              acc +
              course.modules.reduce(
                (moduleAcc: number, module: ModuleWithLessons) => {
                  return moduleAcc + module.lessons.length;
                },
                0,
              )
            );
          },
          0,
        );

        // Calculate completed lessons across all users in department
        let totalCompletedLessons = 0;
        for (const deptUser of dept.users) {
          const overallProgress = await calculateOverallProgress(deptUser.id);
          totalCompletedLessons += overallProgress.completedLessons;
        }

        const completionRate =
          totalLessons > 0
            ? Math.round((totalCompletedLessons / totalLessons) * 100)
            : 0;

        return {
          id: dept.id,
          name: dept.name,
          parentDepartmentId: dept.parentDepartmentId || null,
          parentDepartment: dept.parentDepartment || null,
          subDepartments: dept.subDepartments || [],
          _count: {
            users: dept.users.length,
            courses: dept.courses.length,
          },
          progress: {
            totalLessons,
            completedLessons: totalCompletedLessons,
            completionRate,
          },
        };
      }),
    );

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
