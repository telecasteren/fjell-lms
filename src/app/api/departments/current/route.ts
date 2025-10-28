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

    const department = await prisma.department.findUnique({
      where: { id: user.departmentId },
      select: {
        id: true,
        name: true,
        orgNr: true,
        logoUrl: true,
        darkModeLogoUrl: true,
        logoText: true,
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ department });
  } catch (error) {
    console.error("Get current department error:", error);
    return NextResponse.json(
      {
        error: "Failed to get department",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
