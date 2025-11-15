import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearUserAvatar() {
  try {
    const email = process.argv[2] || "admin@cubit.no";

    console.log(`Clearing avatar for user: ${email}...`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log(`✓ Found user: ${user.name || user.email}`);
    console.log(`  Current avatar: ${user.image || "None"}`);

    if (!user.image) {
      console.log("ℹ️  User has no avatar to clear");
      return;
    }

    // Clear the avatar URL from database
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { image: null },
      select: {
        id: true,
        email: true,
        image: true,
      },
    });

    console.log("✅ Avatar cleared successfully!");
    console.log(`   User: ${updatedUser.email}`);
    console.log(`   Avatar URL: ${updatedUser.image || "null"}`);
    console.log("\nNote: The actual file in Bunny Storage was not deleted.");
    console.log(
      "      If you want to delete the file, do it manually from Bunny Storage.",
    );
  } catch (error) {
    console.error("❌ Error clearing avatar:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUserAvatar();
