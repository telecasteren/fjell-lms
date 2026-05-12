import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import { getAccessibleDepartmentIds } from "@/lib/department-utils";

// Search users - AUTHOR can search all users, ADMIN can search users in their department and sub-departments
export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminOrAuthor(req);

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Get accessible department IDs (includes sub-departments for ADMIN)
    const accessibleDepartmentIds = await getAccessibleDepartmentIds(user.id);

    // AUTHOR can see all users, ADMIN can only see users in their department and sub-departments
    const whereClause =
      accessibleDepartmentIds === null
        ? {} // AUTHOR sees all
        : { departmentId: { in: accessibleDepartmentIds } };

    // Search users by name or email within accessible departments
    const allUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter users by name or email (case-insensitive)
    const queryLower = query.toLowerCase();
    const users = allUsers
      .filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(queryLower)) ||
          (user.email && user.email.toLowerCase().includes(queryLower)),
      )
      .slice(0, 20); // Limit results to 20

    return NextResponse.json({ users });
  } catch (error) {
    console.error("User search error:", error);
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
