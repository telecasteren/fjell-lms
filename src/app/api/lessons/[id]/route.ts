import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriterOrAuthor } from "@/lib/rbac";
import { validateRequestBody } from "@/lib/validation";
import { lessonUpdateSchema } from "@/lib/validation";
import { storageManager } from "@/lib/storage";
import { canManageLesson } from "@/lib/department-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireWriterOrAuthor(req);
    const { id } = await params;

    // Check if user can manage this lesson
    const canManage = await canManageLesson(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to access this lesson" },
        { status: 403 }
      );
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id },
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
  } catch (error) {
    console.error("Lesson GET error:", error);
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireWriterOrAuthor(req);
    const { id } = await params;
    const body = await req.json();

    console.log("Lesson PATCH request body:", body);

    // Check if user can manage this lesson
    const canManage = await canManageLesson(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage this lesson" },
        { status: 403 }
      );
    }

    const validation = validateRequestBody(lessonUpdateSchema, body);
    if (!validation.success) {
      console.log("Validation error:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, content, contentType, order } = validation.data;
    console.log("Validated data:", { title, content, contentType, order });

    const updated = await prisma.lesson.update({
      where: { id },
      data: { title, content, contentType, order },
    });
    return NextResponse.json({ lesson: updated });
  } catch (error) {
    console.error("Lesson PATCH error:", error);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireWriterOrAuthor(req);
    const { id } = await params;

    // Check if user can manage this lesson
    const canManage = await canManageLesson(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to delete this lesson" },
        { status: 403 }
      );
    }

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
        type MultimediaFile = {
          id: string;
          name?: string;
          url?: string;
          metadata?: { fullPath?: string };
        };
        const multimediaFiles = (lesson.multimediaFiles as MultimediaFile[]);
        console.log(
          "Found multimedia files to delete:",
          multimediaFiles.length
        );

        for (const file of multimediaFiles) {
          try {
            // Use the metadata fullPath or construct from file structure
            const metadataFullPath = file.metadata?.fullPath;
            const filePath: string = 
              (typeof metadataFullPath === "string" ? metadataFullPath : null) ||
              (typeof file.id === "string" ? file.id : null) ||
              (typeof file.url === "string" ? file.url : null) ||
              "";
            
            if (!filePath) {
              console.error(`Unable to determine file path for ${file.name || "unknown"}`);
              fileDeletionErrors.push(file.name || "unknown");
              continue;
            }
            
            console.log("Deleting file:", filePath);

            // Delete from Bunny Storage
            const deleted = await storageManager.deleteFile(filePath);
            if (deleted) {
              console.log(`✓ Deleted: ${file.name || filePath}`);
            } else {
              fileDeletionErrors.push(file.name || filePath);
              console.log(`✗ Failed to delete: ${file.name || filePath}`);
            }
          } catch (error) {
            console.error(
              `Failed to delete file ${file.name || "unknown"}:`,
              error
            );
            fileDeletionErrors.push(file.name || "unknown");
            // Continue deleting other files even if one fails
          }
        }
      } catch (error) {
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
    await prisma.lesson.delete({
      where: { id },
    });

    console.log("✓ Lesson deleted successfully");

    // Return success even if some file deletions failed
    type MultimediaFile = {
      id: string;
      name?: string;
      url?: string;
    };
    const multimediaFiles = lesson.multimediaFiles as MultimediaFile[] | null;
    return NextResponse.json({
      success: true,
      deletedFiles: multimediaFiles
        ? multimediaFiles.length - fileDeletionErrors.length
        : 0,
      failedFiles: fileDeletionErrors.length,
      warnings:
        fileDeletionErrors.length > 0
          ? "Some multimedia files could not be deleted from storage."
          : undefined,
    });
  } catch (error) {
    console.error("Lesson deletion error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
