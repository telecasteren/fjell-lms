import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriterOrAdminOrAuthor } from "@/lib/rbac";
import { canManageCourse } from "@/lib/department-utils";
import { courseUpdateSchema, validateRequestBody } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireWriterOrAdminOrAuthor(req);
    const { id } = await params;
    const body = await req.json();

    const validation = validateRequestBody(courseUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, description, status, global } = validation.data;

    // Check if user can manage this course
    const canManage = await canManageCourse(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage this course" },
        { status: 403 },
      );
    }

    // Check if user is in FOX-LMS department for global flag changes
    const userDepartment = await prisma.department.findUnique({
      where: { id: user.departmentId },
      select: { name: true },
    });

    // Only AUTHOR in FOX-LMS department can set global flag
    const isInFoxLmsDepartment = userDepartment?.name === "FOX-LMS";
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (
      global !== undefined &&
      user.role === "AUTHOR" &&
      isInFoxLmsDepartment
    ) {
      updateData.global = global;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ course: updated });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireWriterOrAdminOrAuthor(req);
    const { id } = await params;

    // Check if user can manage this course
    const canManage = await canManageCourse(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to delete this course" },
        { status: 403 },
      );
    }

    // Use a transaction to delete course and all related data
    await prisma.$transaction(async (tx) => {
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
      const lessonIds = modules.flatMap((module) =>
        module.lessons.map((lesson) => lesson.id),
      );

      if (lessonIds.length > 0) {
        await tx.progress.deleteMany({
          where: { lessonId: { in: lessonIds } },
        });
      }

      // Delete all quizzes for lessons in this course
      const quizIds = modules.flatMap((module) =>
        module.lessons
          .filter((lesson) => lesson.quiz)
          .map((lesson) => lesson.quiz!.id),
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
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete course error:", error);
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
}
