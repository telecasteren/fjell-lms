import { prisma } from "@/lib/prisma";

/**
 * Clean up expired invitations
 * This function should be called periodically to remove expired invitations
 */
export async function cleanupExpiredInvitations() {
  try {
    const now = new Date();

    // Update expired invitations status
    const updatedCount = await prisma.invitation.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lte: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    console.log(`Marked ${updatedCount.count} invitations as expired`);

    // Optionally, delete very old expired invitations (older than 90 days)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

    const deletedCount = await prisma.invitation.deleteMany({
      where: {
        status: "EXPIRED",
        expiresAt: { lte: threeMonthsAgo },
      },
    });

    console.log(`Deleted ${deletedCount.count} old expired invitations`);

    return {
      updated: updatedCount.count,
      deleted: deletedCount.count,
    };
  } catch (error) {
    console.error("Error cleaning up expired invitations:", error);
    throw error;
  }
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(invitationId: string) {
  try {
    const invitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "CANCELLED" },
    });

    return invitation;
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    throw error;
  }
}

/**
 * Get invitation statistics
 */
export async function getInvitationStats(departmentId?: string) {
  try {
    const whereClause = departmentId ? { departmentId } : {};

    const stats = await prisma.invitation.groupBy({
      by: ["status"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    const result = {
      pending: 0,
      accepted: 0,
      expired: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      switch (stat.status) {
        case "PENDING":
          result.pending = stat._count.id;
          break;
        case "ACCEPTED":
          result.accepted = stat._count.id;
          break;
        case "EXPIRED":
          result.expired = stat._count.id;
          break;
        case "CANCELLED":
          result.cancelled = stat._count.id;
          break;
      }
    });

    return result;
  } catch (error) {
    console.error("Error fetching invitation stats:", error);
    throw error;
  }
}
