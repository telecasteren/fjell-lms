import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWriterOrAdminOrAuthor } from "@/lib/rbac";
import { canAccessCourse, canManageModule } from "@/lib/department-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    // Check if user can access this course
    const canAccess = await canAccessCourse(user.id, moduleData.courseId);
    if (!canAccess) {
      return NextResponse.json(
        { error: "You don't have access to this course" },
        { status: 403 },
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: { moduleId: id },
      select: {
        id: true,
        title: true,
        content: true,
        contentType: true,
        multimediaFiles: true,
        order: true,
        quiz: {
          select: {
            id: true,
            mandatory: true,
            questions: true, // Include questions to check if quiz has any
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
        mandatory?: boolean;
        questions?: unknown; // Questions array (we check if it exists and has length)
        completions: Array<{ passed: boolean; attempts: number }>;
      } | null;
    };

    // Transform lessons to include quiz completion data
    // Only include quiz if it has questions
    const transformedLessons = lessons.map((lesson: LessonWithQuiz) => {
      const hasQuestions =
        lesson.quiz &&
        Array.isArray(lesson.quiz.questions) &&
        lesson.quiz.questions.length > 0;
      return {
        ...lesson,
        // Only include quiz if it has questions, otherwise set to null
        quiz:
          hasQuestions && lesson.quiz
            ? {
                id: lesson.quiz.id,
                mandatory: lesson.quiz.mandatory,
              }
            : null,
        quizCompletion: lesson.quiz?.completions[0] || null,
      };
    });
    return NextResponse.json({ lessons: transformedLessons });
  } catch (error) {
    console.error("Lessons API error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );
    // If it's an AuthError, use its status, otherwise check if it's a known error
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      const errorMessage =
        error instanceof Error ? error.message : "Unauthorized";
      return NextResponse.json({ error: errorMessage }, { status });
    }
    // For other errors, log them and return 500 with detailed error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails =
      error instanceof Error ? error.stack : "No stack trace";
    console.error("Unexpected error in lessons API:", errorMessage);
    console.error("Error details:", errorDetails);
    return NextResponse.json(
      {
        error: errorMessage || "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireWriterOrAdminOrAuthor(req);
    const { title, content } = await req.json();
    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    const { id } = await params;

    // Check if user can manage this module
    const canManage = await canManageModule(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage this module" },
        { status: 403 },
      );
    }

    const count = await prisma.lesson.count({ where: { moduleId: id } });
    const lesson = await prisma.lesson.create({
      data: { title, content, order: count + 1, moduleId: id },
    });
    return NextResponse.json({ lesson });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
