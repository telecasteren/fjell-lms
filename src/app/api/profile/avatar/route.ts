import { NextResponse, NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { storageManager } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

// Upload user avatar
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with department info
    const userWithDept = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        departmentId: true,
        image: true,
      },
    });

    if (!userWithDept) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Delete old avatar if it exists
    if (userWithDept.image) {
      try {
        // Extract path from URL (remove CDN base URL)
        const oldPath = userWithDept.image.replace(
          "https://fox-lms-pull-zone.b-cdn.net/",
          "",
        );
        await storageManager.deleteFile(oldPath);
        console.log("Old avatar deleted:", oldPath);
      } catch (error) {
        console.error("Error deleting old avatar:", error);
        // Continue even if deletion fails
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const fileName = `avatar-${timestamp}.${fileExtension}`;

    // Create path: avatars/{departmentId}/{userId}/{filename}
    const path = `avatars/${userWithDept.departmentId}/${userWithDept.id}`;

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
        { status: 500 },
      );
    }

    // Update user record with new avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: userWithDept.id },
      data: { image: result.file.url },
      select: {
        id: true,
        image: true,
      },
    });

    return NextResponse.json({
      success: true,
      image: updatedUser.image,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload avatar",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
