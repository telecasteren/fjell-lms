import { NextResponse } from "next/server";
import { createDevUser } from "@/lib/dev-user";

export async function POST() {
  try {
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
      { status: 500 }
    );
  }
}
