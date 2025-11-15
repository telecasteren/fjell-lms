import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get FOX-LMS department footer data
 * This endpoint is public (no auth required) as it's used for footer fallback
 */
export async function GET() {
  try {
    const foxLmsDepartment = await prisma.department.findUnique({
      where: { name: "FOX-LMS" },
      select: {
        logoText: true,
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
      },
    });

    if (!foxLmsDepartment) {
      return NextResponse.json(
        { error: "FOX-LMS department not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ department: foxLmsDepartment });
  } catch (error) {
    console.error("Error fetching FOX-LMS footer data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch FOX-LMS footer data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
