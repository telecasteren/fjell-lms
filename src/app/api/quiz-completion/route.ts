import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { quizId, passed, score } = await req.json();
    if (!quizId)
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });

    // Check if user has access to this quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if user is enrolled in the course or is an AUTHOR with access to the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: quiz.lesson.module.courseId,
        },
      },
    });

    // For AUTHOR users, check if they have access to the course
    const courseAccess =
      user.role === "AUTHOR"
        ? await prisma.course.findFirst({
            where: {
              id: quiz.lesson.module.courseId,
              departmentId: user.departmentId,
            },
          })
        : null;

    if (!enrollment && !courseAccess) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 },
      );
    }

    // Upsert quiz completion
    const quizCompletion = await prisma.quizCompletion.upsert({
      where: { userId_quizId: { userId: user.id, quizId } },
      update: {
        passed: passed === true,
        score: score || 0,
        attempts: { increment: 1 },
        completedAt: new Date(),
      },
      create: {
        userId: user.id,
        quizId,
        passed: passed === true,
        score: score || 0,
        attempts: 1,
        completedAt: new Date(),
      },
    });

    // If quiz is passed, mark the lesson as completed
    if (passed) {
      await prisma.progress.upsert({
        where: {
          userId_lessonId: { userId: user.id, lessonId: quiz.lessonId },
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
        create: {
          userId: user.id,
          lessonId: quiz.lessonId,
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ quizCompletion });
  } catch (error) {
    console.error("Quiz completion error:", error);
    return NextResponse.json(
      { error: "Failed to save quiz completion" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
    }

    const quizCompletion = await prisma.quizCompletion.findUnique({
      where: { userId_quizId: { userId: user.id, quizId } },
    });

    return NextResponse.json({ quizCompletion });
  } catch (error) {
    console.error("Quiz completion fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz completion" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
    }

    // Check if quiz completion exists and belongs to the user
    const quizCompletion = await prisma.quizCompletion.findUnique({
      where: { userId_quizId: { userId: user.id, quizId } },
      include: {
        quiz: {
          include: {
            lesson: true,
          },
        },
      },
    });

    if (!quizCompletion) {
      return NextResponse.json(
        { error: "Quiz completion not found" },
        { status: 404 },
      );
    }

    // Delete the quiz completion
    await prisma.quizCompletion.delete({
      where: { userId_quizId: { userId: user.id, quizId } },
    });

    // If the quiz was mandatory and the lesson was auto-completed, uncomplete the lesson
    const quiz = quizCompletion.quiz;
    if (quiz.mandatory && quizCompletion.passed) {
      await prisma.progress.updateMany({
        where: {
          userId: user.id,
          lessonId: quiz.lessonId,
          completed: true,
        },
        data: {
          completed: false,
          completedAt: null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quiz completion delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz completion" },
      { status: 500 },
    );
  }
}
