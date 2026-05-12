import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import { getAccessibleDepartmentIds } from "@/lib/department-utils";
import { invitationCreateSchema, validateRequestBody } from "@/lib/validation";
import { withRateLimit, rateLimiters } from "@/lib/rate-limit";
import crypto from "crypto";

// GET /api/invitations - List invitations
export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminOrAuthor(req);

    // Get accessible department IDs (includes sub-departments for ADMIN)
    const accessibleDepartmentIds = await getAccessibleDepartmentIds(user.id);

    // AUTHOR can see all invitations, ADMIN can only see invitations in their department and sub-departments
    const whereClause =
      accessibleDepartmentIds === null
        ? {} // AUTHOR sees all
        : { departmentId: { in: accessibleDepartmentIds } };

    const invitations = await prisma.invitation.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        acceptedAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

// POST /api/invitations - Create invitation
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await withRateLimit(req, rateLimiters.admin);
    if (!rateLimitResult.success) {
      return rateLimitResult.error;
    }

    const user = await requireAdminOrAuthor(req);
    const body = await req.json();

    const validation = validateRequestBody(invitationCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email, role, departmentId } = validation.data;

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
        { error: "User with this email already exists" },
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

    // Validate department access
    const accessibleDepartmentIds = await getAccessibleDepartmentIds(user.id);
    if (
      accessibleDepartmentIds !== null &&
      !accessibleDepartmentIds.includes(departmentId)
    ) {
      return NextResponse.json(
        { error: "Access denied to target department" },
        { status: 403 },
      );
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        departmentId,
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
        expiresAt: true,
        status: true,
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
