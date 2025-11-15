import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { emailUpdateSchema, validateRequestBody } from "@/lib/validation";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = validateRequestBody(emailUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { email } = validation.data;

    // Check if email is already taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }

    // Update user email
    await prisma.user.update({
      where: { id: user.id },
      data: { email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email update error:", error);
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 },
    );
  }
}
