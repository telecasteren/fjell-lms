import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminOrAuthor(req);

    const enrollments = await prisma.enrollment.findMany({
      where: {
        user: {
          departmentId: user.departmentId,
        },
      },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ enrollments });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminOrAuthor(req);
    const { userId, courseId } = await req.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "User ID and Course ID required" },
        { status: 400 },
      );
    }

    // Get user's department with parent department info
    const userDepartment = await prisma.department.findUnique({
      where: { id: user.departmentId },
      select: {
        parentDepartmentId: true,
      },
    });

    // Check if target user is in same department
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        departmentId: user.departmentId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found in department" },
        { status: 404 },
      );
    }

    // Check if course exists and is in department or parent department
    const departmentIds = [user.departmentId];
    if (userDepartment?.parentDepartmentId) {
      departmentIds.push(userDepartment.parentDepartmentId);
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        departmentId: {
          in: departmentIds,
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or not available for enrollment" },
        { status: 404 },
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "User already enrolled" },
        { status: 409 },
      );
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        courseId: courseId,
      },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ enrollment });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
