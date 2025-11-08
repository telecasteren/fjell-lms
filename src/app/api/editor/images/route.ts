import { NextResponse, NextRequest } from "next/server";
import { requireWriterOrAdminOrAuthor } from "@/lib/rbac";
import { storageManager } from "@/lib/storage";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Upload image from editor
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has editor permissions
    await requireWriterOrAdminOrAuthor(req);

    // Get user with department info
    const userWithDept = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        departmentId: true,
      },
    });

    if (!userWithDept) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for editor images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileName = `editor-${timestamp}-${randomStr}.${fileExtension}`;

    // Create path: editor-images/{departmentId}/{userId}/{filename}
    const path = `editor-images/${userWithDept.departmentId}/${userWithDept.id}`;

    // Upload to storage
    const result = await storageManager.uploadFile(file, path, {
      fileName: fileName,
      contentType: file.type,
      userId: userWithDept.id,
      departmentId: userWithDept.departmentId,
      uploadedAt: new Date().toISOString(),
    });

    if (!result.success || !result.file) {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.file.url,
    });
  } catch (error) {
    console.error("Editor image upload error:", error);
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

