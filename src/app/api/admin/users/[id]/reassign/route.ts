import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuthorOnly(req);
    const { id } = await params;
    const { departmentId } = await req.json();

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 },
      );
    }

    // Verify the department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    // Get the user to be reassigned
    const userToReassign = await prisma.user.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!userToReassign) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow reassigning yourself
    if (id === user.id) {
      return NextResponse.json(
        { error: "Cannot reassign yourself" },
        { status: 400 },
      );
    }

    // Update user's department
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { departmentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
      },
    });

    // Handle course enrollments - remove enrollments from courses not in the new department
    const newDepartmentCourses = await prisma.course.findMany({
      where: { departmentId },
      select: { id: true },
    });

    const newDepartmentCourseIds = newDepartmentCourses.map(
      (course) => course.id,
    );

    // Remove enrollments from courses not in the new department
    await prisma.enrollment.deleteMany({
      where: {
        userId: id,
        courseId: {
          notIn: newDepartmentCourseIds,
        },
      },
    });

    // Remove progress for lessons in courses not in the new department
    const lessonsInNewDepartment = await prisma.lesson.findMany({
      where: {
        module: {
          course: {
            departmentId,
          },
        },
      },
      select: { id: true },
    });

    const lessonIdsInNewDepartment = lessonsInNewDepartment.map(
      (lesson) => lesson.id,
    );

    await prisma.progress.deleteMany({
      where: {
        userId: id,
        lessonId: {
          notIn: lessonIdsInNewDepartment,
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User successfully reassigned to ${department.name}`,
    });
  } catch (error) {
    console.error("Error reassigning user:", error);
    return NextResponse.json(
      { error: "Failed to reassign user" },
      { status: 500 },
    );
  }
}
