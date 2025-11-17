import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import { getAccessibleDepartmentIds } from "@/lib/department-utils";
import { withRateLimit, rateLimiters } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminOrAuthor(req);

    // Get accessible department IDs (includes sub-departments for ADMIN)
    const accessibleDepartmentIds = await getAccessibleDepartmentIds(user.id);

    // AUTHOR can see all users, ADMIN can only see users in their department and sub-departments
    const whereClause =
      accessibleDepartmentIds === null
        ? {} // AUTHOR sees all
        : { departmentId: { in: accessibleDepartmentIds } };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await withRateLimit(req, rateLimiters.admin);
    if (!rateLimitResult.success) {
      return rateLimitResult.error;
    }

    const user = await requireAdminOrAuthor(req);
    const body = await req.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { email, role, departmentId } = body;

    // Restrict role creation based on user role
    if (user.role === "ADMIN") {
      // ADMIN users can only create BASIC, ADMIN, or WRITER users
      if (role !== "BASIC" && role !== "ADMIN" && role !== "WRITER") {
        return NextResponse.json(
          {
            error: "ADMIN users can only create BASIC, ADMIN, or WRITER users",
          },
          { status: 403 },
        );
      }
    } else if (user.role === "AUTHOR") {
      // AUTHOR users can create any role
      if (!["BASIC", "ADMIN", "WRITER", "AUTHOR"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Pending invitation already exists for this email" },
        { status: 409 },
      );
    }

    // Determine target department ID
    const targetDepartmentId = departmentId || user.departmentId;

    // Validate department access if departmentId is provided
    if (departmentId && departmentId !== user.departmentId) {
      const accessibleDepartmentIds = await getAccessibleDepartmentIds(user.id);

      // Check if user has access to the target department
      // null means AUTHOR can access all departments
      if (
        accessibleDepartmentIds !== null &&
        !accessibleDepartmentIds.includes(departmentId)
      ) {
        return NextResponse.json(
          { error: "Access denied to target department" },
          { status: 403 },
        );
      }
    }

    // Generate secure token
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create invitation instead of user
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role || "BASIC",
        departmentId: targetDepartmentId,
        token,
        expiresAt,
        createdById: user.id,
        status: "PENDING",
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
