import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrAuthor } from "@/lib/rbac";

// DELETE /api/invitations/[id] - Cancel/delete invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrAuthor(req);
    const { id } = await params;

    // Find and delete the invitation
    const invitation = await prisma.invitation.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: "Invitation deleted successfully",
      invitation,
    });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 404 }
    );
  }
}
