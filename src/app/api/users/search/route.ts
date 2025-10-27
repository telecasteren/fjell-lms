import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";

// Search all users across all departments (AUTHOR only)
export async function GET(req: NextRequest) {
  try {
    await requireAuthorOnly(req); // Authorization check only

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search users by name or email across all departments
    // Get all users and filter in memory for case-insensitive search
    const allUsers = await prisma.user.findMany({
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
        user =>
          (user.name && user.name.toLowerCase().includes(queryLower)) ||
          (user.email && user.email.toLowerCase().includes(queryLower))
      )
      .slice(0, 20); // Limit results to 20

    return NextResponse.json({ users });
  } catch {
    console.error("User search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
