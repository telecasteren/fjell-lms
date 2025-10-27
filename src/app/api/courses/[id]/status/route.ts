import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";
import { CourseStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;
    const { status } = await req.json();

    if (!status || !Object.values(CourseStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const course = await prisma.course.update({
      where: { id }, // FIXED: AUTHORs can update ANY course status, not just their department
      data: { status },
    });

    return NextResponse.json({ course });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
