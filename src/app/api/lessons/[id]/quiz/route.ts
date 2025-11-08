import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWriterOrAdminOrAuthor } from "@/lib/rbac";
import { canManageLesson, canAccessCourse } from "@/lib/department-utils";

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

    // Check if user can access this course (for viewing quiz)
    // This allows enrolled users, AUTHOR/WRITER/ADMIN who can manage the course
    const canAccess = await canAccessCourse(user.id, lesson.module.courseId);
    
    // Also check if user can manage the lesson (for AUTHOR/WRITER/ADMIN editing)
    const canManage = await canManageLesson(user.id, id);
    
    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: lesson.module.courseId,
        },
      },
    });

    // Allow access if: enrolled, can access course, or can manage lesson
    if (!enrollment && !canAccess && !canManage) {
      return NextResponse.json(
        { error: "You don't have access to this quiz" },
        { status: 403 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: id },
      select: { id: true, questions: true, mandatory: true },
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
    const user = await requireWriterOrAdminOrAuthor(req);
    const { questions, mandatory } = await req.json();
    if (!questions)
      return NextResponse.json(
        { error: "Questions required" },
        { status: 400 }
      );
    const { id } = await params;

    // Check if user can manage this lesson
    const canManage = await canManageLesson(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage this lesson" },
        { status: 403 }
      );
    }

    const quiz = await prisma.quiz.upsert({
      where: { lessonId: id },
      update: { questions, mandatory: mandatory ?? false },
      create: { lessonId: id, questions, mandatory: mandatory ?? false },
    });
    return NextResponse.json({ quiz });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
