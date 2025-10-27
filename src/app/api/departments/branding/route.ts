import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";
import { storageManager } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const user = await requireAuthorOnly(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle FormData
    const formData = await req.formData();
    const departmentId = formData.get("departmentId") as string;
    const logoText = formData.get("logoText") as string;
    const file = formData.get("file") as File;

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    // Get current department to check for existing logo
    const currentDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { logoUrl: true },
    });

    let logoUrl: string | undefined = undefined;

    // Upload logo file if provided
    if (file && file.size > 0) {
      // Delete old logo if it exists
      if (currentDepartment?.logoUrl) {
        try {
          // Extract the storage path from the CDN URL
          // URL format: https://fox-lms-pull-zone.b-cdn.net/{fullPath}
          const oldLogoUrl = currentDepartment.logoUrl;
          const urlMatch = oldLogoUrl.match(/b-cdn\.net\/(.+)/);
          if (urlMatch) {
            const oldFilePath = urlMatch[1];
            await storageManager.deleteFile(oldFilePath);
            console.log("Deleted old logo:", oldFilePath);
          }
        } catch (error) {
          console.error("Failed to delete old logo (continuing anyway):", error);
          // Continue even if delete fails - we don't want to block the upload
        }
      }

      const path = `departments/${departmentId}/logo`;
      const result = await storageManager.uploadFile(file, path, {
        fileName: file.name,
        contentType: file.type,
        departmentId,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
      });

      if (result.success && result.file) {
        logoUrl = result.file.url;
      } else {
        return NextResponse.json(
          { error: "Failed to upload logo" },
          { status: 500 }
        );
      }
    }

    // Update department branding
    const updateData: {
      logoUrl?: string;
      logoText?: string;
    } = {};
    if (logoUrl) updateData.logoUrl = logoUrl;
    if (logoText !== null && logoText !== undefined)
      updateData.logoText = logoText;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: updateData,
    });

    return NextResponse.json({
      department,
      message: "Department branding updated successfully",
    });
  } catch (error) {
    console.error("Update department branding error:", error);
    return NextResponse.json(
      {
        error: "Failed to update department branding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
