import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { calculateCourseProgress } from "@/lib/progress-utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    // Check if user is enrolled in the course or is an AUTHOR with access to the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: id,
        },
      },
    });

    // For AUTHOR users, check if they have access to the course
    const courseAccess =
      user.role === "AUTHOR"
        ? await prisma.course.findFirst({
            where: { id, departmentId: user.departmentId },
          })
        : null;

    if (!enrollment && !courseAccess) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Calculate course progress using standardized logic
    const { completedCount, totalCount, percentage } =
      await calculateCourseProgress(user.id, id);

    // Get detailed progress map for compatibility
    const lessons = await prisma.lesson.findMany({
      where: {
        module: {
          courseId: id,
        },
      },
      select: { id: true },
    });

    type ProgressEntry = {
      lessonId: string;
      completed: boolean;
      completedAt: Date | null;
    };

    const lessonIds = lessons.map(l => l.id);
    const progressMap = await prisma.progress
      .findMany({
        where: {
          userId: user.id,
          lessonId: { in: lessonIds },
        },
        select: {
          lessonId: true,
          completed: true,
          completedAt: true,
        },
      })
      .then(progress =>
        progress.reduce(
          (acc, p: ProgressEntry) => {
            acc[p.lessonId] = p;
            return acc;
          },
          {} as Record<string, ProgressEntry>
        )
      );

    return NextResponse.json({
      courseId: id,
      completedCount,
      totalCount,
      percentage,
      progressMap,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
