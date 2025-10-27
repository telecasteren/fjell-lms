import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { getLessonCompletions } from "@/lib/progress-utils";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Use ID from token if available, otherwise fall back to email
    let user = null;
    if (token?.id) {
      user = await prisma.user.findUnique({ where: { id: token.id as string } });
    } else if (token?.email) {
      user = await prisma.user.findUnique({ where: { email: token.email as string } });
    }
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  // Get user's enrolled courses only
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
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

  type CourseWithModules = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    modules: Array<{
      lessons: Array<{ id: string }>;
    }>;
  };

  const courses = enrollments.map(
    enrollment => enrollment.course as CourseWithModules
  );

  // Get user's progress for all lessons using standardized logic
  const allLessonIds = courses.flatMap(course =>
    course.modules.flatMap(module => module.lessons.map(lesson => lesson.id))
  );

  const completionMap = await getLessonCompletions(user.id, allLessonIds);

  // Calculate stats for each course
  const courseStats = courses.map(course => {
    const courseLessonIds = course.modules.flatMap(module =>
      module.lessons.map(lesson => lesson.id)
    );
    const completedCount = courseLessonIds.filter(
      lessonId => completionMap[lessonId]
    ).length;
    const totalCount = courseLessonIds.length;
    const percentage =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      status: course.status,
      completedCount,
      totalCount,
      percentage,
      isOngoing: completedCount > 0 && completedCount < totalCount,
      isCompleted: completedCount === totalCount && totalCount > 0,
    };
  });

  // Separate courses by status
  const ongoingCourses = courseStats.filter((c: any) => c.isOngoing);
  const completedCourses = courseStats.filter((c: any) => c.isCompleted);
  const notStartedCourses = courseStats.filter(
    (c: any) => c.completedCount === 0
  );

  // Find current course in focus (most recently active ongoing course)
  const currentCourse =
    ongoingCourses.length > 0
      ? ongoingCourses.sort((a: any, b: any) => b.percentage - a.percentage)[0]
      : null;

  // Overall statistics
  const totalCompletedLessons =
    Object.values(completionMap).filter(Boolean).length;
  const totalLessons = allLessonIds.length;
  const overallPercentage =
    totalLessons > 0
      ? Math.round((totalCompletedLessons / totalLessons) * 100)
      : 0;

  return NextResponse.json({
    currentCourse,
    ongoingCourses,
    completedCourses,
    notStartedCourses,
    overallStats: {
      totalCourses: courses.length,
      totalLessons,
      completedLessons: totalCompletedLessons,
      percentage: overallPercentage,
    },
  });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
