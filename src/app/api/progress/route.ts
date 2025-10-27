import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const progress = await prisma.progress.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        completed: true,
        completedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ progress });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);

    const { lessonId, completed } = await req.json();
    if (!lessonId)
      return NextResponse.json(
        { error: "Lesson ID required" },
        { status: 400 }
      );

    // Check if user is enrolled in the course containing this lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check if user is enrolled in the course or is an AUTHOR with access to the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: lesson.module.courseId,
        },
      },
    });

    // For AUTHOR users, check if they have access to the course
    const courseAccess =
      user.role === "AUTHOR"
        ? await prisma.course.findFirst({
            where: {
              id: lesson.module.courseId,
              departmentId: user.departmentId,
            },
          })
        : null;

    if (!enrollment && !courseAccess) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    const progress = await prisma.progress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: {
        completed: completed === true,
        completedAt: completed === true ? new Date() : null,
      },
      create: {
        userId: user.id,
        lessonId,
        completed: completed === true,
        completedAt: completed === true ? new Date() : null,
      },
    });

    return NextResponse.json({ progress });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
