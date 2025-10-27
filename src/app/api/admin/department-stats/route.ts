import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import {
  getLessonCompletions,
  calculateOverallProgress,
} from "@/lib/progress-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminOrAuthor(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get department information
    const department = await prisma.department.findUnique({
      where: { id: user.departmentId },
      select: {
        id: true,
        name: true,
        orgNr: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        courses: {
          select: {
            id: true,
            title: true,
            status: true,
            modules: {
              select: {
                lessons: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Calculate completion rate using standardized logic
    const totalLessons = department.courses.reduce((acc: number, course) => {
      return (
        acc +
        course.modules.reduce((moduleAcc: number, module) => {
          return moduleAcc + module.lessons.length;
        }, 0)
      );
    }, 0);

    // Get all lesson IDs for the department
    const allLessonIds = department.courses.flatMap(course =>
      course.modules.flatMap(module => module.lessons.map(lesson => lesson.id))
    );

    // Get all users in the department
    const departmentUsers = await prisma.user.findMany({
      where: { departmentId: user.departmentId },
      select: { id: true },
    });

    // Calculate completed lessons using standardized logic
    let totalCompletedLessons = 0;
    for (const departmentUser of departmentUsers) {
      const completionMap = await getLessonCompletions(
        departmentUser.id,
        allLessonIds
      );
      totalCompletedLessons +=
        Object.values(completionMap).filter(Boolean).length;
    }

    const completionRate =
      totalLessons > 0
        ? Math.round((totalCompletedLessons / totalLessons) * 100)
        : 0;

    // Get user statistics with individual progress
    const userProgressDetails = await Promise.all(
      department.users.map(async deptUser => {
        const overallProgress = await calculateOverallProgress(deptUser.id);
        return {
          id: deptUser.id,
          name: deptUser.name,
          email: deptUser.email,
          role: deptUser.role,
          createdAt: deptUser.createdAt,
          progress: {
            totalCourses: overallProgress.totalCourses,
            completedCourses: overallProgress.completedCourses,
            totalLessons: overallProgress.totalLessons,
            completedLessons: overallProgress.completedLessons,
            completionRate: overallProgress.percentage,
          },
        };
      })
    );

    const userStats = {
      total: department.users.length,
      admins: department.users.filter(u => u.role === "ADMIN").length,
      basic: department.users.filter(u => u.role === "BASIC").length,
      active: userProgressDetails.filter(u => u.progress.totalCourses > 0)
        .length,
      inactive: userProgressDetails.filter(u => u.progress.totalCourses === 0)
        .length,
    };

    // Get total enrolled courses for the department
    const enrollments = await prisma.enrollment.findMany({
      where: {
        user: {
          departmentId: user.departmentId,
        },
      },
      select: {
        courseId: true,
      },
    });

    // Get unique course IDs to count total enrolled courses
    const enrolledCourseIds = [...new Set(enrollments.map(e => e.courseId))];
    const totalEnrolledCourses = enrolledCourseIds.length;

    return NextResponse.json({
      department: {
        id: department.id,
        name: department.name,
        orgNr: department.orgNr,
      },
      stats: {
        completionRate,
        totalLessons,
        completedLessons: totalCompletedLessons,
        userStats,
        totalEnrolledCourses,
      },
      users: userProgressDetails,
      courses: department.courses,
    });
  } catch (error) {
    console.error("Get department stats error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch department stats",
      },
      { status: 500 }
    );
  }
}
