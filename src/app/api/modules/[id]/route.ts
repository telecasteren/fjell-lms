import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriterOrAdminOrAuthor } from "@/lib/rbac";
import { canManageModule } from "@/lib/department-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireWriterOrAdminOrAuthor(req);
    const { id } = await params;
    const { title } = await req.json();

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Check if user can manage this module
    const canManage = await canManageModule(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage this module" },
        { status: 403 },
      );
    }

    const existingModule = await prisma.module.findFirst({
      where: { id },
    });

    if (!existingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Update the module
    const updatedModule = await prisma.module.update({
      where: { id },
      data: { title: title.trim() },
    });

    return NextResponse.json({ module: updatedModule });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireWriterOrAdminOrAuthor(req);
    const { id } = await params;

    // Check if user can manage this module
    const canManage = await canManageModule(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to delete this module" },
        { status: 403 },
      );
    }

    const existingModule = await prisma.module.findFirst({
      where: { id },
      include: {
        lessons: true,
      },
    });

    if (!existingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check if module has lessons
    if (existingModule.lessons.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete module with existing lessons",
        },
        { status: 400 },
      );
    }

    // Delete the module
    await prisma.module.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
