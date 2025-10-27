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
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    // Check if course exists and is in department
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        departmentId: user.departmentId,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
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
        { status: 409 }
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
