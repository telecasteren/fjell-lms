import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  calculateOverallProgress,
  calculateCourseProgress,
} from "@/lib/progress-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get department information
    const department = await prisma.department.findUnique({
      where: { id: user.departmentId },
      select: { id: true, name: true },
    });

    // Get user's completion stats using standardized logic
    const overallProgress = await calculateOverallProgress(user.id);
    const overallCompletion = overallProgress.percentage;
    const totalCourses = overallProgress.totalCourses;
    const completedCourses = overallProgress.completedCourses;

    // Get recent activity (first 3 enrollments with progress)
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
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

    // Calculate actual completed lessons for recent activity
    const recentActivity = await Promise.all(
      enrollments.slice(0, 3).map(async (enrollment) => {
        const courseProgress = await calculateCourseProgress(
          user.id,
          enrollment.course.id,
        );
        return {
          id: enrollment.id,
          courseTitle: enrollment.course.title,
          completedLessons: courseProgress.completedCount,
        };
      }),
    );

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
      },
      department,
      stats: {
        totalCourses,
        completedCourses,
        overallCompletion,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
