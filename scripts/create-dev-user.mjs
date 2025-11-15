import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createDevUser() {
  try {
    // Check if dev user already exists
    const existing = await prisma.user.findUnique({
      where: { email: "fox-author@dev.no" },
    });

    if (existing) {
      console.log(
        "Dev user already exists:",
        existing.email,
        "Role:",
        existing.role,
      );
      return existing;
    }

    // Ensure FOX-LMS department exists
    const department = await prisma.department.upsert({
      where: { name: "FOX-LMS" },
      update: {},
      create: { name: "FOX-LMS" },
    });

    // Create dev user with Author role
    const passwordHash = await bcrypt.hash("dev123", 10);
    const devUser = await prisma.user.create({
      data: {
        name: "Fox Author Dev",
        email: "fox-author@dev.no",
        passwordHash: passwordHash,
        role: "AUTHOR",
        departmentId: department.id,
      },
    });

    console.log("Dev user created successfully!");
    console.log("Email:", devUser.email);
    console.log("Role:", devUser.role);
    console.log("Password: dev123");
    return devUser;
  } catch (error) {
    console.error("Error creating dev user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDevUser();
