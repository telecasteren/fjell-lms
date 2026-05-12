import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLessonCompletions } from "@/lib/progress-utils";
import { getCurrentUser } from "@/lib/session";
import { withApiHandler } from "@/lib/api/handler";

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = await getCurrentUser(req);
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
    (enrollment) => enrollment.course as CourseWithModules,
  );

  // Get user's progress for all lessons using standardized logic
  const allLessonIds = courses.flatMap((course) =>
    course.modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id),
    ),
  );

  const completionMap = await getLessonCompletions(user.id, allLessonIds);

  // Calculate stats for each course
  type CourseStat = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    completedCount: number;
    totalCount: number;
    percentage: number;
    isOngoing: boolean;
    isCompleted: boolean;
  };

  const courseStats: CourseStat[] = courses.map((course) => {
    const courseLessonIds = course.modules.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id),
    );
    const completedCount = courseLessonIds.filter(
      (lessonId) => completionMap[lessonId],
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
  const ongoingCourses = courseStats.filter((c) => c.isOngoing);
  const completedCourses = courseStats.filter((c) => c.isCompleted);
  const notStartedCourses = courseStats.filter((c) => c.completedCount === 0);

  // Find current course in focus (most recently active ongoing course)
  const currentCourse =
    ongoingCourses.length > 0
      ? ongoingCourses.sort((a, b) => b.percentage - a.percentage)[0]
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
});
