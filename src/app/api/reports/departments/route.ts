import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import { withRateLimit, rateLimiters } from "@/lib/rate-limit";
import {
  getLessonCompletions,
  calculateOverallProgress,
} from "@/lib/progress-utils";

export async function GET(req: Request) {
  try {
    // Apply rate limiting
    const rateLimitResult = await withRateLimit(req, rateLimiters.reports);
    if (!rateLimitResult.success) {
      return rateLimitResult.error;
    }

    const user = await requireAdminOrAuthor(req);

    // For AUTHOR users, show all departments. For ADMIN/BASIC users, show only their department
    const whereClause =
      user.role === "AUTHOR"
        ? {} // AUTHOR sees all departments
        : { id: user.departmentId }; // ADMIN/BASIC see only their department

    // Get departments with detailed statistics
    const departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        courses: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
            enrollments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    progresses: {
                      select: {
                        id: true,
                        completed: true,
                        completedAt: true,
                        lessonId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate detailed statistics for each department
    const departmentReports = await Promise.all(
      departments.map(async dept => {
        // User statistics
        const userStats = {
          total: dept.users.length,
          byRole: {
            BASIC: dept.users.filter(u => u.role === "BASIC").length,
            ADMIN: dept.users.filter(u => u.role === "ADMIN").length,
            AUTHOR: dept.users.filter(u => u.role === "AUTHOR").length,
          },
          recentUsers: dept.users
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 5),
        };

        // Course statistics
        const courseStats = {
          total: dept.courses.length,
          byStatus: {
            DRAFT: dept.courses.filter(c => c.status === "DRAFT").length,
            PUBLISHED: dept.courses.filter(c => c.status === "PUBLISHED")
              .length,
            ARCHIVED: dept.courses.filter(c => c.status === "ARCHIVED").length,
          },
          totalEnrollments: dept.courses.reduce(
            (acc, course) => acc + course.enrollments.length,
            0
          ),
        };

        // Progress statistics using standardized utilities
        const totalLessons = dept.courses.reduce((acc, course) => {
          return (
            acc +
            course.modules.reduce((moduleAcc, module) => {
              return moduleAcc + module.lessons.length;
            }, 0)
          );
        }, 0);

        // Get all lesson IDs for the department
        const allLessonIds = dept.courses.flatMap(course =>
          course.modules.flatMap(module =>
            module.lessons.map(lesson => lesson.id)
          )
        );

        // Calculate individual user progress using standardized utilities
        const userProgressDetails = await Promise.all(
          dept.users.map(async deptUser => {
            const overallProgress = await calculateOverallProgress(deptUser.id);
            return {
              userId: deptUser.id,
              userName: deptUser.name || "Unknown",
              userEmail: deptUser.email || "Unknown",
              userRole: deptUser.role,
              completed: overallProgress.completedLessons,
              total: overallProgress.totalLessons,
              completionRate: overallProgress.percentage,
              totalCourses: overallProgress.totalCourses,
              completedCourses: overallProgress.completedCourses,
            };
          })
        );

        // Calculate overall department completion
        const totalCompletedLessons = userProgressDetails.reduce(
          (acc, user) => acc + user.completed,
          0
        );

        const progressStats = {
          overallCompletionRate:
            totalLessons > 0
              ? Math.round((totalCompletedLessons / totalLessons) * 100)
              : 0,
          totalLessons,
          completedLessons: totalCompletedLessons,
          userProgress: userProgressDetails,
        };

        // Top performing courses
        const coursePerformance = dept.courses
          .map(course => {
            const enrollments = course.enrollments.length;
            const completedEnrollments = course.enrollments.filter(
              enrollment => {
                const courseLessons = course.modules.flatMap(
                  module => module.lessons
                );
                const userCompleted = enrollment.user.progresses.filter(
                  p => p.completed
                ).length;
                return userCompleted >= courseLessons.length;
              }
            ).length;

            return {
              courseId: course.id,
              courseTitle: course.title,
              enrollments,
              completedEnrollments,
              completionRate:
                enrollments > 0
                  ? Math.round((completedEnrollments / enrollments) * 100)
                  : 0,
              status: course.status,
            };
          })
          .sort((a, b) => b.completionRate - a.completionRate);

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          userStats,
          courseStats,
          progressStats,
          coursePerformance,
          createdAt: dept.createdAt,
        };
      })
    );

    // Overall platform statistics
    const overallStats = {
      totalDepartments: departments.length,
      totalUsers: departments.reduce((acc, dept) => acc + dept.users.length, 0),
      totalCourses: departments.reduce(
        (acc, dept) => acc + dept.courses.length,
        0
      ),
      totalEnrollments: departments.reduce(
        (acc, dept) =>
          acc +
          dept.courses.reduce(
            (courseAcc, course) => courseAcc + course.enrollments.length,
            0
          ),
        0
      ),
    };

    return NextResponse.json({
      overallStats,
      departmentReports,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
