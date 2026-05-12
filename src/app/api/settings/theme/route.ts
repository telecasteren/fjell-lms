import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const themeUpdateSchema = z.object({
  theme: z.enum(["light", "dark"]),
});

export async function PATCH(req: NextRequest) {
  try {
    console.log("Theme update request received");
    const user = await getCurrentUser(req);
    console.log("User found:", user ? user.id : "null");
    if (!user) {
      console.error("No user found in theme update request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Request body:", body);
    const validation = themeUpdateSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation failed:", validation.error);
      return NextResponse.json(
        { error: "Invalid theme value. Must be 'light' or 'dark'" },
        { status: 400 },
      );
    }
    const { theme } = validation.data;
    console.log("Updating theme to:", theme);

    // Update user theme
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { theme },
      select: {
        id: true,
        theme: true,
      },
    });
    console.log("Theme updated successfully:", updatedUser.theme);

    return NextResponse.json({ theme: updatedUser.theme });
  } catch (error) {
    console.error("Theme update error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to update theme",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
