import { NextResponse, NextRequest } from "next/server";
import { requireAuthorOnly } from "@/lib/rbac";
import { storageManager } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Upload multimedia files for a lesson
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;

    // Verify lesson exists and user has access
    const lesson = await prisma.lesson.findFirst({
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

    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];
    const errors = [];

    console.log("Starting multimedia upload for lesson:", id);
    console.log("Files to upload:", files.length);

    // Upload each file
    for (const file of files) {
      try {
        console.log("Processing file:", file.name, file.size, file.type);

        // Create path: lessons/{lessonId}/multimedia/{filename}
        const path = `lessons/${id}/multimedia`;

        // Upload to storage
        const result = await storageManager.uploadFile(file, path, {
          fileName: file.name,
          contentType: file.type,
          lessonId: id,
          uploadedBy: user.id,
          uploadedAt: new Date().toISOString(),
        });

        if (result.success && result.file) {
          console.log("File uploaded successfully:", result.file.url);
          uploadedFiles.push(result.file);
        } else {
          console.error("Upload failed:", result.error);
          errors.push(`${file.name}: ${result.error || "Upload failed"}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        errors.push(
          `${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`
        );
      }
    }

    console.log("Upload complete:", {
      uploadedFiles: uploadedFiles.length,
      errors: errors.length,
    });

    type MultimediaFile = {
      id: string;
      name: string;
      url: string;
      size: number;
      type: string;
      metadata?: Record<string, unknown>;
    };

    // Update lesson with multimedia files
    if (uploadedFiles.length > 0) {
      const existingFiles = (lesson.multimediaFiles || []) as MultimediaFile[];
      const updatedFiles = [...existingFiles, ...uploadedFiles];

      await prisma.lesson.update({
        where: { id },
        data: {
          multimediaFiles: updatedFiles as Prisma.InputJsonValue,
          contentType: "multimedia",
        },
      });
    }

    return NextResponse.json({
      success: uploadedFiles.length > 0,
      uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Multimedia upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// Get multimedia files for a lesson
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;

    // Get lesson with multimedia files
    const lesson = await prisma.lesson.findFirst({
      where: { id },
      select: {
        id: true,
        title: true,
        multimediaFiles: true,
        contentType: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        multimediaFiles: lesson.multimediaFiles || [],
        contentType: lesson.contentType,
      },
    });
  } catch (error) {
    console.error("Get multimedia files error:", error);
    return NextResponse.json({ error: "Failed to get files" }, { status: 500 });
  }
}

// Delete a multimedia file
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;
    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    // Get lesson to verify access and find the file
    const lesson = await prisma.lesson.findFirst({
      where: { id },
      select: { multimediaFiles: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Find the file to delete
    type MultimediaFile = {
      id: string;
      name: string;
      url: string;
      size: number;
      type: string;
      metadata?: Record<string, unknown>;
    };

    const existingFiles = (lesson.multimediaFiles || []) as MultimediaFile[];
    const fileToDelete = existingFiles.find(
      (file: MultimediaFile) => file.id === fileId
    );

    if (!fileToDelete) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    console.log("Deleting file:", fileToDelete);

    // Get the file path for deletion from Bunny Storage
    // metadata.fullPath might be a string, otherwise use the file id
    const metadataFullPath = fileToDelete.metadata?.fullPath;
    const filePath: string = 
      (typeof metadataFullPath === "string" ? metadataFullPath : null) || 
      fileToDelete.id;
    
    console.log("Deleting from Bunny Storage with path:", filePath);

    // Delete from Bunny Storage
    const deleted = await storageManager.deleteFile(filePath);

    if (deleted) {
      console.log("Successfully deleted from Bunny Storage");

      // Remove from lesson's multimedia files in database
      const updatedFiles = existingFiles.filter(
        (file: MultimediaFile) => file.id !== fileId
      );

      await prisma.lesson.update({
        where: { id },
        data: { multimediaFiles: updatedFiles as Prisma.InputJsonValue },
      });

      console.log("Successfully removed from database");
      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
      });
    } else {
      console.error("Failed to delete from Bunny Storage");
      return NextResponse.json(
        { error: "Failed to delete file from storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Delete multimedia file error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
