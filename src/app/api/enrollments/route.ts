import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        createdAt: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ enrollments });
  } catch {
    if (error instanceof Error && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID required" },
        { status: 400 }
      );
    }

    // FIXED: AUTHORs can enroll in ANY course, ADMIN/BASIC can only enroll in published courses
    const whereClause =
      user.role === "AUTHOR"
        ? { id: courseId } // AUTHORs can enroll in any course
        : { id: courseId, status: "PUBLISHED" }; // ADMIN/BASIC can only enroll in published courses

    const course = await prisma.course.findFirst({
      where: whereClause,
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or not available for enrollment" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: courseId,
      },
      select: {
        id: true,
        createdAt: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({ enrollment });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth(req);
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID required" },
        { status: 400 }
      );
    }

    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 404 }
      );
    }

    // Delete the enrollment
    await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    // Also delete all progress for lessons in this course
    const lessons = await prisma.lesson.findMany({
      where: {
        module: {
          courseId: courseId,
        },
      },
      select: { id: true },
    });

    if (lessons.length > 0) {
      await prisma.progress.deleteMany({
        where: {
          userId: user.id,
          lessonId: {
            in: lessons.map(lesson => lesson.id),
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
