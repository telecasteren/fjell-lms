import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWriterOrAdminOrAuthor } from "@/lib/rbac";
import { canAccessCourse, canManageCourse } from "@/lib/department-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    // Check if user can access this course
    const canAccess = await canAccessCourse(user.id, id);
    if (!canAccess) {
      return NextResponse.json(
        { error: "You don't have access to this course" },
        { status: 403 }
      );
    }

    const modules = await prisma.module.findMany({
      where: { courseId: id },
      select: { id: true, title: true, order: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ modules });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireWriterOrAdminOrAuthor(req);
    const { title } = await req.json();
    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    const { id } = await params;

    // Check if user can manage this course
    const canManage = await canManageCourse(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage this course" },
        { status: 403 }
      );
    }

    const count = await prisma.module.count({ where: { courseId: id } });
    const newModule = await prisma.module.create({
      data: { title, order: count + 1, courseId: id },
    });
    return NextResponse.json({ module: newModule });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
