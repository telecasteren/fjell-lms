import { NextResponse, NextRequest } from "next/server";
import { createDevUser } from "@/lib/dev-user";
import { requirePermission } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    // Never allow this endpoint outside local development.
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await requirePermission("admin:access", req);

    const devUser = await createDevUser();
    return NextResponse.json({
      success: true,
      user: {
        email: devUser.email,
        role: devUser.role,
        name: devUser.name,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create dev user" },
      { status: 500 },
    );
  }
}
