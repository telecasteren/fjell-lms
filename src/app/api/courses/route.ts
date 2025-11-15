import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWriterOrAdminOrAuthor } from "@/lib/rbac";
import { courseCreateSchema, validateRequestBody } from "@/lib/validation";
import { withRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getCourseWhereClause } from "@/lib/department-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // For ADMIN and WRITER, we want to show all courses from their own department
    // (DRAFT, PUBLISHED, ARCHIVED) but only published from other departments
    // So we don't apply status filter at the database level - we'll filter in frontend
    // For BASIC users, we still filter by status at database level for performance
    const includeStatusFilter = user.role === "BASIC";
    const whereClause = await getCourseWhereClause(
      user.id,
      includeStatusFilter,
    );

    // Get courses with enrollment counts
    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            parentDepartmentId: true,
          },
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
      departmentId: string;
      department: {
        id: string;
        name: string;
        parentDepartmentId: string | null;
      } | null;
      enrollments: Array<{ id: string }>;
    };

    // Get FOX-LMS department ID to identify root department courses
    const foxLmsDepartment = await prisma.department.findUnique({
      where: { name: "FOX-LMS" },
      select: { id: true },
    });

    // Transform courses to include enrollment count and department name
    const coursesWithEnrollments = courses.map(
      (course: CourseWithDepartment) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        createdAt: course.createdAt,
        departmentId: course.departmentId,
        departmentName: course.department?.name,
        isFoxLmsCourse: foxLmsDepartment
          ? course.departmentId === foxLmsDepartment.id
          : false,
        enrollmentCount: course.enrollments.length,
      }),
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

    // Allow AUTHOR, WRITER, and ADMIN roles to create courses
    const user = await requireWriterOrAdminOrAuthor(req);
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
