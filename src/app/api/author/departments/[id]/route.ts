import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthorOnly } from "@/lib/rbac";
import { calculateOverallProgress } from "@/lib/progress-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthorOnly(req); // Authorization check only
    const { id } = await params;

    // Get department details
    const department = await prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        orgNr: true,
        logoUrl: true,
        darkModeLogoUrl: true,
        logoText: true,
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
        { status: 404 }
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
