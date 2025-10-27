import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";
import { validateRequestBody } from "@/lib/validation";
import { lessonUpdateSchema } from "@/lib/validation";
import { storageManager } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;
    // FIXED: AUTHORs can access ANY lesson, not just their department
    const lesson = await prisma.lesson.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        contentType: true,
        multimediaFiles: true,
        order: true,
      },
    });
    if (!lesson)
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    // Return lesson data with defaults for backwards compatibility
    const lessonWithDefaults = {
      ...lesson,
      contentType: lesson.contentType || "text",
      multimediaFiles: lesson.multimediaFiles || [],
    };

    return NextResponse.json({ lesson: lessonWithDefaults });
  } catch {
    console.error("Lesson GET error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;
    const body = await req.json();

    console.log("Lesson PATCH request body:", body);

    const validation = validateRequestBody(lessonUpdateSchema, body);
    if (!validation.success) {
      console.log("Validation error:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, content, contentType, order } = validation.data;
    console.log("Validated data:", { title, content, contentType, order });

    // FIXED: AUTHORs can update ANY lesson, not just their department
    const updated = await prisma.lesson.update({
      where: {
        id,
      },
      data: { title, content, contentType, order },
    });
    return NextResponse.json({ lesson: updated });
  } catch {
    console.error("Lesson PATCH error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;

    // Get lesson details including multimedia files before deletion
    const lesson = await prisma.lesson.findFirst({
      where: { id },
      select: {
        id: true,
        title: true,
        multimediaFiles: true,
        quiz: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    console.log("Deleting lesson:", id);

    // Try to delete multimedia files from Bunny Storage (non-critical)
    const fileDeletionErrors = [];
    if (lesson.multimediaFiles) {
      try {
        const multimediaFiles = lesson.multimediaFiles as any[];
        console.log(
          "Found multimedia files to delete:",
          multimediaFiles.length
        );

        for (const file of multimediaFiles) {
          try {
            // Use the metadata fullPath or construct from file structure
            const filePath = file.metadata?.fullPath || file.id || file.url;
            console.log("Deleting file:", filePath);

            // Delete from Bunny Storage
            const deleted = await storageManager.deleteFile(filePath);
            if (deleted) {
              console.log(`✓ Deleted: ${file.name || filePath}`);
            } else {
              fileDeletionErrors.push(file.name || filePath);
              console.log(`✗ Failed to delete: ${file.name || filePath}`);
            }
          } catch {
            console.error(
              `Failed to delete file ${file.name || "unknown"}:`,
              error
            );
            fileDeletionErrors.push(file.name || "unknown");
            // Continue deleting other files even if one fails
          }
        }
      } catch {
        console.error("Error during multimedia file deletion:", error);
        // Non-critical error, continue with lesson deletion
      }
    }

    // Delete associated records first due to foreign key constraints
    // Delete quiz if it exists
    if (lesson.quiz) {
      await prisma.quiz.delete({
        where: { lessonId: id },
      });
    }

    // Delete progress records
    await prisma.progress.deleteMany({
      where: { lessonId: id },
    });

    // Now delete lesson from database (critical operation)
    // FIXED: AUTHORs can delete ANY lesson, not just their department
    await prisma.lesson.delete({
      where: { id },
    });

    console.log("✓ Lesson deleted successfully");

    // Return success even if some file deletions failed
    return NextResponse.json({
      success: true,
      deletedFiles: lesson.multimediaFiles
        ? (lesson.multimediaFiles as any[]).length - fileDeletionErrors.length
        : 0,
      failedFiles: fileDeletionErrors.length,
      warnings:
        fileDeletionErrors.length > 0
          ? "Some multimedia files could not be deleted from storage."
          : undefined,
    });
  } catch {
    console.error("Lesson deletion error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
