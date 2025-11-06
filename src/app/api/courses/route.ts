import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWriterOrAuthor } from "@/lib/rbac";
import { courseCreateSchema, validateRequestBody } from "@/lib/validation";
import { withRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getCourseWhereClause } from "@/lib/department-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Use reusable utility to get course where clause based on role and hierarchy
    const whereClause = await getCourseWhereClause(user.id, true);

    // Get courses with enrollment counts
    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        department: {
          select: { name: true },
        },
        enrollments: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    type CourseWithDepartment = {
      id: string;
      title: string;
      description: string | null;
      status: string;
      createdAt: Date;
      department: {
        name: string;
      } | null;
      enrollments: Array<{ id: string }>;
    };

    // Transform courses to include enrollment count and department name
    const coursesWithEnrollments = courses.map(
      (course: CourseWithDepartment) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        createdAt: course.createdAt,
        departmentName: course.department?.name,
        enrollmentCount: course.enrollments.length,
      })
    );

    return NextResponse.json({
      courses: coursesWithEnrollments,
      user: {
        role: user.role,
        departmentId: user.departmentId,
      },
    });
  } catch (error) {
    // Handle custom AuthError with status
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return NextResponse.json({ error: "Unauthorized" }, { status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await withRateLimit(req, rateLimiters.courses);
    if (!rateLimitResult.success) {
      return rateLimitResult.error;
    }

    // Allow AUTHOR and WRITER roles to create courses
    const user = await requireWriterOrAuthor(req);
    const body = await req.json();
    const validation = validateRequestBody(courseCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { title, description } = validation.data;
    
    // WRITER can only create courses in their own department
    // AUTHOR can create courses in any department (but defaults to their own)
    const course = await prisma.course.create({
      data: { title, description, departmentId: user.departmentId },
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
