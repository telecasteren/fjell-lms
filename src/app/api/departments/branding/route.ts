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
    const darkModeFile = formData.get("darkModeFile") as File;
    const useSameLogoForDarkMode = formData.get("useSameLogoForDarkMode") === "true";

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    // Get current department to check for existing logos
    const currentDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { 
        logoUrl: true,
        darkModeLogoUrl: true 
      },
    });

    let logoUrl: string | undefined = undefined;
    let darkModeLogoUrl: string | undefined = undefined;

    // Upload light mode logo file if provided
    if (file && file.size > 0) {
      // Delete old light logo if it exists
      if (currentDepartment?.logoUrl) {
        try {
          // Extract the storage path from the CDN URL
          // URL format: https://fox-lms-pull-zone.b-cdn.net/{fullPath}
          const oldLogoUrl = currentDepartment.logoUrl;
          const urlMatch = oldLogoUrl.match(/b-cdn\.net\/(.+)/);
          if (urlMatch) {
            const oldFilePath = urlMatch[1];
            await storageManager.deleteFile(oldFilePath);
            console.log("Deleted old light logo:", oldFilePath);
          }
        } catch (error) {
          console.error("Failed to delete old light logo (continuing anyway):", error);
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
          { error: "Failed to upload light logo" },
          { status: 500 }
        );
      }
    }

    // Handle dark mode logo
    if (useSameLogoForDarkMode) {
      // If using same logo for dark mode, set darkModeLogoUrl to null
      darkModeLogoUrl = null;
      
      // Also delete the existing dark mode logo from storage if it exists
      if (currentDepartment?.darkModeLogoUrl) {
        try {
          const oldDarkLogoUrl = currentDepartment.darkModeLogoUrl;
          const urlMatch = oldDarkLogoUrl.match(/b-cdn\.net\/(.+)/);
          if (urlMatch) {
            const oldFilePath = urlMatch[1];
            await storageManager.deleteFile(oldFilePath);
            console.log("Deleted old dark logo:", oldFilePath);
          }
        } catch (error) {
          console.error("Failed to delete old dark logo (continuing anyway):", error);
        }
      }
    } else if (darkModeFile && darkModeFile.size > 0) {
      // Upload dark mode logo file if provided
      // Delete old dark logo if it exists
      if (currentDepartment?.darkModeLogoUrl) {
        try {
          const oldDarkLogoUrl = currentDepartment.darkModeLogoUrl;
          const urlMatch = oldDarkLogoUrl.match(/b-cdn\.net\/(.+)/);
          if (urlMatch) {
            const oldFilePath = urlMatch[1];
            await storageManager.deleteFile(oldFilePath);
            console.log("Deleted old dark logo:", oldFilePath);
          }
        } catch (error) {
          console.error("Failed to delete old dark logo (continuing anyway):", error);
        }
      }

      const path = `departments/${departmentId}/logo-dark`;
      const result = await storageManager.uploadFile(darkModeFile, path, {
        fileName: darkModeFile.name,
        contentType: darkModeFile.type,
        departmentId,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
      });

      if (result.success && result.file) {
        darkModeLogoUrl = result.file.url;
      } else {
        return NextResponse.json(
          { error: "Failed to upload dark logo" },
          { status: 500 }
        );
      }
    }

    // Update department branding
    const updateData: {
      logoUrl?: string;
      darkModeLogoUrl?: string | null;
      logoText?: string;
    } = {};
    if (logoUrl) updateData.logoUrl = logoUrl;
    if (darkModeLogoUrl !== undefined) updateData.darkModeLogoUrl = darkModeLogoUrl;
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
