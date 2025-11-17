import { NextResponse } from "next/server";
import { cleanupExpiredInvitations } from "@/lib/invitation-utils";

// POST /api/invitations/cleanup - Clean up expired invitations
export async function POST() {
  try {
    const result = await cleanupExpiredInvitations();

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${result.updated} invitations marked as expired, ${result.deleted} old invitations deleted`,
      ...result,
    });
  } catch (error) {
    console.error("Error during invitation cleanup:", error);
    return NextResponse.json(
      { error: "Failed to cleanup invitations" },
      { status: 500 },
    );
  }
}
