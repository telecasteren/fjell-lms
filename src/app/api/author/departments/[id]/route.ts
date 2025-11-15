import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";
import { calculateOverallProgress } from "@/lib/progress-utils";
import { getAccessibleDepartmentIds } from "@/lib/department-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Allow AUTHOR and ADMIN users
    const user = await requireAdminOrAuthor(req);
    const { id } = await params;

    // Check if user has access to this department
    const accessibleDepartmentIds = await getAccessibleDepartmentIds(user.id);
    if (
      accessibleDepartmentIds !== null &&
      !accessibleDepartmentIds.includes(id)
    ) {
      return NextResponse.json(
        { error: "You don't have permission to access this department" },
        { status: 403 },
      );
    }

    // Get department details with hierarchy
    const department = await prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        orgNr: true,
        logoUrl: true,
        darkModeLogoUrl: true,
        logoText: true,
        appDescription: true,
        parentDepartmentId: true,
        parentDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
        // Footer fields
        footerLinkSectionTitle: true,
        footerLink1Url: true,
        footerLink1Text: true,
        footerLink2Url: true,
        footerLink2Text: true,
        footerLink3Url: true,
        footerLink3Text: true,
        footerContactEmail: true,
        footerContactPhone: true,
        footerContactAddress: true,
        footerContactAddress2: true,
        subDepartments: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                users: true,
                courses: true,
              },
            },
          },
        },
        createdAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        courses: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true },
                },
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    // Calculate department completion rate using standardized utilities
    const totalLessons = department.courses.reduce((acc, course) => {
      return (
        acc +
        course.modules.reduce((moduleAcc, module) => {
          return moduleAcc + module.lessons.length;
        }, 0)
      );
    }, 0);

    // Calculate completed lessons across all users in department
    let totalCompletedLessons = 0;
    for (const deptUser of department.users) {
      const overallProgress = await calculateOverallProgress(deptUser.id);
      totalCompletedLessons += overallProgress.completedLessons;
    }

    const completionRate =
      totalLessons > 0
        ? Math.round((totalCompletedLessons / totalLessons) * 100)
        : 0;

    return NextResponse.json({
      department: {
        ...department,
        completionRate,
        totalLessons,
        completedLessons: totalCompletedLessons,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
