import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdminOrAuthor(req);
    const { id } = await params;
    const { name, email, role } = await req.json();
    
    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
    }
    
    // Restrict role changes based on user role
    if (user.role === "ADMIN") {
      // ADMIN users can only set BASIC or ADMIN roles
      if (role !== "BASIC" && role !== "ADMIN") {
        return NextResponse.json({ error: "ADMIN users can only set BASIC or ADMIN roles" }, { status: 403 });
      }
    } else if (user.role === "AUTHOR") {
      // AUTHOR users can set any role
      if (!Object.values(Role).includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
    }
    
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        id: { not: id }
      }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: "Email already taken by another user" }, { status: 409 });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        name,
        email,
        role,
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
    console.error('Update user error:', error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdminOrAuthor(req);
    const { id } = await params;
    
    // Don't allow deleting yourself
    if (id === user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }
    
    // Delete user and all associated data
    await prisma.user.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
