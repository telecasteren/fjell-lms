import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthorOnly } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    // Get the module and its course
    const moduleData = await prisma.module.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!moduleData) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check if user is enrolled in the course or is an AUTHOR with access to the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: moduleData.courseId,
        },
      },
    });

    // FIXED: AUTHORs can access ANY course, not just their department
    const courseAccess =
      user.role === "AUTHOR"
        ? await prisma.course.findFirst({
            where: { id: moduleData.courseId },
          })
        : null;

    if (!enrollment && !courseAccess) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: { moduleId: id },
      select: {
        id: true,
        title: true,
        content: true,
        order: true,
        quiz: {
          select: {
            id: true,
            completions: {
              where: { userId: user.id },
              select: { passed: true, attempts: true },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    type LessonWithQuiz = {
      id: string;
      title: string;
      content: string | null;
      order: number;
      quiz: {
        id: string;
        completions: Array<{ passed: boolean; attempts: number }>;
      } | null;
    };

    // Transform lessons to include quiz completion data
    const transformedLessons = lessons.map((lesson: LessonWithQuiz) => ({
      ...lesson,
      quizCompletion: lesson.quiz?.completions[0] || null,
    }));
    return NextResponse.json({ lessons: transformedLessons });
  } catch {
    console.error("Lessons API error:", error);
    const status = (error as { status?: number })?.status || 401;
    return NextResponse.json(
      { error: (error as Error).message || "Unauthorized" },
      { status }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { title, content } = await req.json();
    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    const { id } = await params;
    const count = await prisma.lesson.count({ where: { moduleId: id } });
    const lesson = await prisma.lesson.create({
      data: { title, content, order: count + 1, moduleId: id },
    });
    return NextResponse.json({ lesson });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
