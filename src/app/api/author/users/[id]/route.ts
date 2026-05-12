import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";
import { Role } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;
    const { name, email, role, departmentId } = await req.json();

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 },
      );
    }

    // Validate role
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        id: { not: id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already taken by another user" },
        { status: 409 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        ...(departmentId && { departmentId }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;

    // Don't allow deleting yourself
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 },
      );
    }

    // Delete user with cascade delete of related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's progress records
      await tx.progress.deleteMany({
        where: { userId: id },
      });

      // Delete user's quiz completions
      await tx.quizCompletion.deleteMany({
        where: { userId: id },
      });

      // Delete user's enrollments
      await tx.enrollment.deleteMany({
        where: { userId: id },
      });

      // Delete user's sessions
      await tx.session.deleteMany({
        where: { userId: id },
      });

      // Delete user's accounts
      await tx.account.deleteMany({
        where: { userId: id },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);

    // Handle foreign key constraint violations
    if (
      error &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete user. This user has associated records that must be deleted first.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
