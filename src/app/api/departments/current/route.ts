import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.departmentId) {
      return NextResponse.json(
        { error: "User has no department assigned" },
        { status: 400 },
      );
    }

    try {
      const department = await prisma.department.findUnique({
        where: { id: user.departmentId },
        select: {
          id: true,
          name: true,
          orgNr: true,
          logoUrl: true,
          darkModeLogoUrl: true,
          logoText: true,
          appDescription: true,
          parentDepartmentId: true,
          parentDepartment: {
            select: {
              id: true,
              name: true,
            },
          },
          // Footer fields
          footerLinkSectionTitle: true,
          footerLink1Url: true,
          footerLink1Text: true,
          footerLink2Url: true,
          footerLink2Text: true,
          footerLink3Url: true,
          footerLink3Text: true,
          footerContactEmail: true,
          footerContactPhone: true,
          footerContactAddress: true,
          footerContactAddress2: true,
        },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ department });
    } catch (prismaError) {
      console.error("Prisma error in get current department:", prismaError);
      console.error("Prisma error details:", {
        message: prismaError instanceof Error ? prismaError.message : "Unknown",
        stack: prismaError instanceof Error ? prismaError.stack : undefined,
        name: prismaError instanceof Error ? prismaError.name : undefined,
      });
      return NextResponse.json(
        {
          error: "Database error",
          details:
            prismaError instanceof Error
              ? prismaError.message
              : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      const message = (error as { message?: string }).message || "Unauthorized";
      return NextResponse.json({ error: message }, { status });
    }
    console.error("Get current department error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );
    console.error(
      "Error name:",
      error instanceof Error ? error.name : "Unknown",
    );
    return NextResponse.json(
      {
        error: "Failed to get department",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
