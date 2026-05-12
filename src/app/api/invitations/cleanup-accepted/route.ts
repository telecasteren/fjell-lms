import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/invitations/cleanup-accepted - Clean up invitations for users who already exist
export async function POST() {
  try {
    // Find all pending invitations where a user with that email already exists
    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        id: true,
        email: true,
      },
    });

    const cleanupResults = [];

    for (const invitation of pendingInvitations) {
      // Check if user exists with this email
      const existingUser = await prisma.user.findUnique({
        where: { email: invitation.email },
      });

      if (existingUser) {
        // Mark invitation as accepted since user exists
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        });

        cleanupResults.push({
          email: invitation.email,
          action: "marked_accepted",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanupResults.length} invitations`,
      results: cleanupResults,
    });
  } catch (error) {
    console.error("Error cleaning up accepted invitations:", error);
    return NextResponse.json(
      { error: "Failed to cleanup invitations" },
      { status: 500 },
    );
  }
}
