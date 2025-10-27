import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAuthorOnly } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    // Check if user is enrolled in the course or is an AUTHOR with access to the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: id,
        },
      },
    });

    // FIXED: AUTHORs can access ANY course, not just their department
    const courseAccess =
      user.role === "AUTHOR"
        ? await prisma.course.findFirst({
            where: { id },
          })
        : null;

    if (!enrollment && !courseAccess) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    const modules = await prisma.module.findMany({
      where: { courseId: id },
      select: { id: true, title: true, order: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ modules });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { title } = await req.json();
    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    const { id } = await params;

    // FIXED: AUTHORs can create modules for ANY course, not just their department
    const courseAccess = await prisma.course.findFirst({
      where: { id },
    });

    if (!courseAccess) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const count = await prisma.module.count({ where: { courseId: id } });
    const newModule = await prisma.module.create({
      data: { title, order: count + 1, courseId: id },
    });
    return NextResponse.json({ module: newModule });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
