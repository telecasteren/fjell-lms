import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Use ID from token if available, otherwise fall back to email
    let user = null;
    if (token?.id) {
      user = await prisma.user.findUnique({
        where: { id: token.id as string },
      });
    } else if (token?.email) {
      user = await prisma.user.findUnique({
        where: { email: token.email as string },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
