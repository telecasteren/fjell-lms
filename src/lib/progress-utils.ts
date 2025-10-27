import { prisma } from "@/lib/prisma";

/**
 * Checks if a lesson is completed for a user, considering both manual progress and quiz completion
 */
export async function isLessonCompleted(
  userId: string,
  lessonId: string
): Promise<boolean> {
  try {
    // Check Progress table first
    const progress = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (progress?.completed) return true;

    // For now, just return based on progress table
    // Quiz completion logic can be added later if needed
    return false;
  } catch {
    console.error("Error in isLessonCompleted:", error);
    return false;
  }
}

/**
 * Gets lesson completion status for multiple lessons efficiently
 */
export async function getLessonCompletions(
  userId: string,
  lessonIds: string[]
): Promise<Record<string, boolean>> {
  if (lessonIds.length === 0) return {};

  try {
    // Simplified approach - just check progress records
    const progressRecords = await prisma.progress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
        completed: true,
      },
      select: { lessonId: true },
    });

    const completionMap: Record<string, boolean> = {};

    // Initialize all lessons as not completed
    lessonIds.forEach(lessonId => {
      completionMap[lessonId] = false;
    });

    // Mark lessons as completed based on progress records
    progressRecords.forEach(progress => {
      completionMap[progress.lessonId] = true;
    });

    return completionMap;
  } catch {
    console.error("Error in getLessonCompletions:", error);
    // Return empty completion map
    const completionMap: Record<string, boolean> = {};
    lessonIds.forEach(lessonId => {
      completionMap[lessonId] = false;
    });
    return completionMap;
  }
}

/**
 * Calculates course progress for a user
 */
export async function calculateCourseProgress(
  userId: string,
  courseId: string
): Promise<{
  completedCount: number;
  totalCount: number;
  percentage: number;
}> {
  // Get all lessons for the course
  const lessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: courseId,
      },
    },
    select: { id: true },
  });

  if (lessons.length === 0) {
    return { completedCount: 0, totalCount: 0, percentage: 0 };
  }

  const lessonIds = lessons.map(l => l.id);
  const completionMap = await getLessonCompletions(userId, lessonIds);

  const completedCount = Object.values(completionMap).filter(Boolean).length;
  const totalCount = lessonIds.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return { completedCount, totalCount, percentage };
}

/**
 * Calculates overall progress for a user across all enrolled courses
 */
export async function calculateOverallProgress(userId: string): Promise<{
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}> {
  try {
    // Get all enrollments for the user
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
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
    });

    const totalCourses = enrollments.length;
    let completedCourses = 0;
    let totalLessons = 0;
    let completedLessons = 0;

    // Get all progress records for this user at once
    const allProgress = await prisma.progress.findMany({
      where: {
        userId,
        completed: true,
      },
      select: { lessonId: true },
    });

    const completedLessonIds = new Set(allProgress.map(p => p.lessonId));

    for (const enrollment of enrollments) {
      const courseLessons = enrollment.course.modules.flatMap(
        module => module.lessons
      );
      const courseLessonIds = courseLessons.map(lesson => lesson.id);
      totalLessons += courseLessonIds.length;

      const courseCompletedLessons = courseLessonIds.filter(id =>
        completedLessonIds.has(id)
      ).length;
      completedLessons += courseCompletedLessons;

      // Course is completed if all lessons are completed
      if (
        courseCompletedLessons === courseLessonIds.length &&
        courseLessonIds.length > 0
      ) {
        completedCourses++;
      }
    }

    const percentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      totalCourses,
      completedCourses,
      totalLessons,
      completedLessons,
      percentage,
    };
  } catch {
    console.error("Error in calculateOverallProgress:", error);
    // Return fallback values
    return {
      totalCourses: 0,
      completedCourses: 0,
      totalLessons: 0,
      completedLessons: 0,
      percentage: 0,
    };
  }
}
