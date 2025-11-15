import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import { getCourseWhereClause } from "@/lib/department-utils";

/**
 * GET endpoint for admin page course selection
 * Returns courses from current department and parent department
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminOrAuthor(req);

    // Use reusable utility to get course where clause based on role and hierarchy
    const whereClause = await getCourseWhereClause(user.id, false);

    // Get courses from accessible departments
    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
