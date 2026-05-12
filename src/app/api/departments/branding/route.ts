import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import { storageManager } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminOrAuthor(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle FormData
    const formData = await req.formData();
    const departmentId = formData.get("departmentId") as string;
    const logoText = formData.get("logoText") as string;
    const appDescription = formData.get("appDescription") as string;
    const file = formData.get("file") as File;
    const darkModeFile = formData.get("darkModeFile") as File;
    const useSameLogoForDarkMode =
      formData.get("useSameLogoForDarkMode") === "true";
    // Footer fields
    const footerLinkSectionTitle = formData.get(
      "footerLinkSectionTitle",
    ) as string;
    const footerLink1Url = formData.get("footerLink1Url") as string;
    const footerLink1Text = formData.get("footerLink1Text") as string;
    const footerLink2Url = formData.get("footerLink2Url") as string;
    const footerLink2Text = formData.get("footerLink2Text") as string;
    const footerLink3Url = formData.get("footerLink3Url") as string;
    const footerLink3Text = formData.get("footerLink3Text") as string;
    const footerContactEmail = formData.get("footerContactEmail") as string;
    const footerContactPhone = formData.get("footerContactPhone") as string;
    const footerContactAddress = formData.get("footerContactAddress") as string;
    const footerContactAddress2 = formData.get(
      "footerContactAddress2",
    ) as string;

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 },
      );
    }

    // ADMIN can only update their own department's branding
    // AUTHOR can update any department's branding
    if (user.role === "ADMIN" && user.departmentId !== departmentId) {
      return NextResponse.json(
        { error: "You can only update your own department's branding" },
        { status: 403 },
      );
    }

    // Get current department to check for existing logos
    const currentDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        logoUrl: true,
        darkModeLogoUrl: true,
      },
    });

    let logoUrl: string | undefined = undefined;
    let darkModeLogoUrl: string | null | undefined = undefined;

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
          console.error(
            "Failed to delete old light logo (continuing anyway):",
            error,
          );
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
          { status: 500 },
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
          console.error(
            "Failed to delete old dark logo (continuing anyway):",
            error,
          );
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
          console.error(
            "Failed to delete old dark logo (continuing anyway):",
            error,
          );
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
          { status: 500 },
        );
      }
    }

    // Update department branding
    const updateData: {
      logoUrl?: string;
      darkModeLogoUrl?: string | null;
      logoText?: string;
      appDescription?: string | null;
      footerLinkSectionTitle?: string | null;
      footerLink1Url?: string | null;
      footerLink1Text?: string | null;
      footerLink2Url?: string | null;
      footerLink2Text?: string | null;
      footerLink3Url?: string | null;
      footerLink3Text?: string | null;
      footerContactEmail?: string | null;
      footerContactPhone?: string | null;
      footerContactAddress?: string | null;
      footerContactAddress2?: string | null;
    } = {};
    if (logoUrl) updateData.logoUrl = logoUrl;
    if (darkModeLogoUrl !== undefined)
      updateData.darkModeLogoUrl = darkModeLogoUrl;
    if (logoText !== null && logoText !== undefined)
      updateData.logoText = logoText;
    if (appDescription !== null && appDescription !== undefined)
      updateData.appDescription = appDescription || null;
    // Footer fields - allow empty strings to clear values
    if (footerLinkSectionTitle !== null && footerLinkSectionTitle !== undefined)
      updateData.footerLinkSectionTitle = footerLinkSectionTitle || null;
    if (footerLink1Url !== null && footerLink1Url !== undefined)
      updateData.footerLink1Url = footerLink1Url || null;
    if (footerLink1Text !== null && footerLink1Text !== undefined)
      updateData.footerLink1Text = footerLink1Text || null;
    if (footerLink2Url !== null && footerLink2Url !== undefined)
      updateData.footerLink2Url = footerLink2Url || null;
    if (footerLink2Text !== null && footerLink2Text !== undefined)
      updateData.footerLink2Text = footerLink2Text || null;
    if (footerLink3Url !== null && footerLink3Url !== undefined)
      updateData.footerLink3Url = footerLink3Url || null;
    if (footerLink3Text !== null && footerLink3Text !== undefined)
      updateData.footerLink3Text = footerLink3Text || null;
    if (footerContactEmail !== null && footerContactEmail !== undefined)
      updateData.footerContactEmail = footerContactEmail || null;
    if (footerContactPhone !== null && footerContactPhone !== undefined)
      updateData.footerContactPhone = footerContactPhone || null;
    if (footerContactAddress !== null && footerContactAddress !== undefined)
      updateData.footerContactAddress = footerContactAddress || null;
    if (footerContactAddress2 !== null && footerContactAddress2 !== undefined)
      updateData.footerContactAddress2 = footerContactAddress2 || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 },
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
      { status: 500 },
    );
  }
}
