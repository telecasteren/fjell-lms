import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;
    const { title } = await req.json();

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // FIXED: AUTHORs can update ANY module, not just their department
    const existingModule = await prisma.module.findFirst({
      where: {
        id,
      },
      include: {
        course: true,
      },
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
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;

    // FIXED: AUTHORs can delete ANY module, not just their department
    const existingModule = await prisma.module.findFirst({
      where: {
        id,
      },
      include: {
        course: true,
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
        { status: 400 }
      );
    }

    // Delete the module
    await prisma.module.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
