import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthorOnly(req);
    const { id } = await params;
    const { title, description } = await req.json();
    const updated = await prisma.course.update({
      where: { id }, // FIXED: AUTHORs can update ANY course, not just their department
      data: { title, description },
    });
    return NextResponse.json({ course: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthorOnly(req);
    const { id } = await params;

    // Use a transaction to delete course and all related data
    await prisma.$transaction(async tx => {
      // Get all modules and their lessons for this course
      const modules = await tx.module.findMany({
        where: { courseId: id },
        include: {
          lessons: {
            include: {
              quiz: true,
              progress: true,
            },
          },
        },
      });

      // Delete all progress records for lessons in this course
      const lessonIds = modules.flatMap(module =>
        module.lessons.map(lesson => lesson.id)
      );

      if (lessonIds.length > 0) {
        await tx.progress.deleteMany({
          where: { lessonId: { in: lessonIds } },
        });
      }

      // Delete all quizzes for lessons in this course
      const quizIds = modules.flatMap(module =>
        module.lessons
          .filter(lesson => lesson.quiz)
          .map(lesson => lesson.quiz!.id)
      );

      if (quizIds.length > 0) {
        await tx.quiz.deleteMany({
          where: { id: { in: quizIds } },
        });
      }

      // Delete all lessons in this course
      if (lessonIds.length > 0) {
        await tx.lesson.deleteMany({
          where: { id: { in: lessonIds } },
        });
      }

      // Delete enrollments
      await tx.enrollment.deleteMany({
        where: { courseId: id },
      });

      // Delete modules
      await tx.module.deleteMany({
        where: { courseId: id },
      });

      // Finally, delete the course
      await tx.course.delete({
        where: { id }, // FIXED: AUTHORs can delete ANY course, not just their department
      });
    });

    return NextResponse.json({ ok: true });
  } catch {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
