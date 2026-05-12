import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/invitations/validate - Validate invitation token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 },
      );
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
