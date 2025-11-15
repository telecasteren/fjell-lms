import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createE2ETestUsers() {
  try {
    // Ensure FOX-LMS department exists
    const department = await prisma.department.upsert({
      where: { name: "FOX-LMS" },
      update: {},
      create: { name: "FOX-LMS" },
    });

    const users = [
      {
        name: "Test Author",
        email: "author@example.com",
        role: "AUTHOR",
        password: "test321",
      },
      {
        name: "Test Admin",
        email: "admin@example.com",
        role: "ADMIN",
        password: "test321",
      },
      {
        name: "Test Basic User",
        email: "basic@example.com",
        role: "BASIC",
        password: "test321",
      },
    ];

    for (const userData of users) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(
          `User ${userData.email} already exists with role ${existing.role}`,
        );
        continue;
      }

      // Create user
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          passwordHash: passwordHash,
          role: userData.role,
          departmentId: department.id,
        },
      });

      console.log(
        `✅ Created ${userData.role} user: ${user.email} (password: ${userData.password})`,
      );
    }

    console.log("\n🎉 All E2E test users are ready!");
  } catch (error) {
    console.error("Error creating E2E test users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createE2ETestUsers();
