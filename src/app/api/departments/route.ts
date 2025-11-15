import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { requireAuthorOnly, requireAdminOrAuthor } from "@/lib/rbac";
import {
  isInChildDepartmentOfFoxLms,
  getDepartmentWhereClause,
} from "@/lib/department-utils";
import { z } from "zod";
import bcrypt from "bcrypt";

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  orgNr: z.string().optional().nullable(),
  parentDepartmentId: z.string().optional().nullable(), // Support for sub-departments
  users: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email is required"),
      role: z.enum(["BASIC", "ADMIN", "WRITER"]),
    }),
  ),
  existingUsers: z
    .array(
      z.object({
        userId: z.string(),
      }),
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Allow AUTHOR and ADMIN users to create departments
    const user = await requireAdminOrAuthor(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Department creation request body:", body);
    const validation = createDepartmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const {
      name,
      orgNr,
      parentDepartmentId,
      users,
      existingUsers = [],
    } = validation.data;

    // AUTHOR can create departments anywhere
    // ADMIN can only create sub-departments under their own department (if they're in a child department of FOX-LMS)
    if (user.role === "ADMIN") {
      // Check if ADMIN is in a child department of FOX-LMS
      const isChildDept = await isInChildDepartmentOfFoxLms(user.id);

      if (!isChildDept) {
        return NextResponse.json(
          {
            error:
              "ADMIN users can only create sub-departments if they are in a child department of FOX-LMS",
          },
          { status: 403 },
        );
      }

      // ADMIN must create sub-departments under their own department
      if (!parentDepartmentId || parentDepartmentId !== user.departmentId) {
        return NextResponse.json(
          {
            error:
              "ADMIN users can only create sub-departments under their own department",
          },
          { status: 403 },
        );
      }
    }

    // If parentDepartmentId is provided, verify it exists and user has permission
    if (parentDepartmentId) {
      const parentDepartment = await prisma.department.findUnique({
        where: { id: parentDepartmentId },
      });

      if (!parentDepartment) {
        return NextResponse.json(
          { error: "Parent department not found" },
          { status: 404 },
        );
      }

      // AUTHOR can create sub-departments under any department
      // ADMIN can only create sub-departments under their own department (already checked above)
    }

    // Check if department name already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { name },
    });

    if (existingDepartment) {
      return NextResponse.json(
        {
          error: "Department with this name already exists",
        },
        { status: 409 },
      );
    }

    // Check if any user emails already exist
    const existingEmails = await prisma.user.findMany({
      where: {
        email: {
          in: users.map((u) => u.email.toLowerCase()),
        },
      },
      select: { email: true },
    });

    if (existingEmails.length > 0) {
      return NextResponse.json(
        {
          error: `Email addresses already exist: ${existingEmails.map((u) => u.email).join(", ")}`,
        },
        { status: 409 },
      );
    }

    // Create department and users in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create department
      const department = await tx.department.create({
        data: {
          name,
          orgNr: orgNr || null,
          parentDepartmentId: parentDepartmentId || null,
        },
      });

      let totalUserCount = 0;

      // Create new users with a placeholder password hash (they'll set their own via sign-up)
      if (users.length > 0) {
        const placeholderPasswordHash = await bcrypt.hash(
          "PLACEHOLDER_PASSWORD",
          12,
        );
        const createdUsers = await tx.user.createMany({
          data: users.map((user) => ({
            name: user.name,
            email: user.email.toLowerCase(),
            role: user.role,
            departmentId: department.id,
            passwordHash: placeholderPasswordHash, // Placeholder hash - user will set password via sign-up
          })),
        });
        totalUserCount += createdUsers.count;
      }

      // Reassign existing users to the new department
      if (existingUsers.length > 0) {
        const assignedUsers = await tx.user.updateMany({
          where: {
            id: {
              in: existingUsers.map((u) => u.userId),
            },
          },
          data: {
            departmentId: department.id,
          },
        });
        totalUserCount += assignedUsers.count;
      }

      return { department, userCount: totalUserCount };
    });

    return NextResponse.json({
      department: result.department,
      userCount: result.userCount,
      message: `Department "${name}" created successfully with ${result.userCount} users`,
    });
  } catch (error) {
    console.error("Create department error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to create department",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get department where clause based on user role and hierarchy
    const whereClause = await getDepartmentWhereClause(user.id);

    const departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Get departments error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch departments",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await requireAuthorOnly(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const departmentId = url.searchParams.get("id");

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 },
      );
    }

    // Get department details
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    // Prevent deleting your own department
    if (department.id === currentUser.departmentId) {
      return NextResponse.json(
        { error: "Cannot delete your own department" },
        { status: 400 },
      );
    }

    // Prevent deleting departments with active users
    if (department._count.users > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete department with ${department._count.users} active user(s). Please reassign users to another department first.`,
        },
        { status: 400 },
      );
    }

    // Delete department (cascades will handle courses, users, and related data)
    await prisma.department.delete({
      where: { id: departmentId },
    });

    let message = `Department "${department.name}" deleted successfully`;
    if (department._count.courses > 0) {
      message += `. ${department._count.courses} course(s) were also deleted.`;
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Delete department error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete department",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
