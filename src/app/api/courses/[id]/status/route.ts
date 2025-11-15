import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriterOrAdminOrAuthor } from "@/lib/rbac";
import { canManageCourse } from "@/lib/department-utils";
import { CourseStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireWriterOrAdminOrAuthor(req);
    const { id } = await params;
    const { status } = await req.json();

    if (!status || !Object.values(CourseStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if user can manage this course
    const canManage = await canManageCourse(user.id, id);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage this course" },
        { status: 403 },
      );
    }

    const course = await prisma.course.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ course });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
