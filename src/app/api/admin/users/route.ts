import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import { getAccessibleDepartmentIds } from "@/lib/department-utils";
import { userUpdateSchema, validateRequestBody } from "@/lib/validation";
import { withRateLimit, rateLimiters } from "@/lib/rate-limit";
import bcrypt from "bcrypt";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminOrAuthor(req);

    // Get accessible department IDs (includes sub-departments for ADMIN)
    const accessibleDepartmentIds = await getAccessibleDepartmentIds(user.id);
    
    // AUTHOR can see all users, ADMIN can only see users in their department and sub-departments
    const whereClause = accessibleDepartmentIds === null 
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
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate user data
    const validation = validateRequestBody(userUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, email, role } = body;

    // Restrict role creation based on user role
    if (user.role === "ADMIN") {
      // ADMIN users can only create BASIC, ADMIN, or WRITER users
      if (role !== "BASIC" && role !== "ADMIN" && role !== "WRITER") {
        return NextResponse.json(
          { error: "ADMIN users can only create BASIC, ADMIN, or WRITER users" },
          { status: 403 }
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
        { status: 409 }
      );
    }

    // Create user with placeholder password hash (user will set password via sign-up link)
    const placeholderPasswordHash = await bcrypt.hash("placeholder", 10);

    // Create user in same department
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: placeholderPasswordHash,
        role: role || "BASIC",
        departmentId: user.departmentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
