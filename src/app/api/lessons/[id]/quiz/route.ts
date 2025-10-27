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

    // Get the lesson and its course
    const lesson = await prisma.lesson.findUnique({
      where: { id },
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

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: id },
      select: { id: true, questions: true },
    });
    return NextResponse.json({ quiz });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { questions } = await req.json();
    if (!questions)
      return NextResponse.json(
        { error: "Questions required" },
        { status: 400 }
      );
    const { id } = await params;
    const quiz = await prisma.quiz.upsert({
      where: { lessonId: id },
      update: { questions },
      create: { lessonId: id, questions },
    });
    return NextResponse.json({ quiz });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
