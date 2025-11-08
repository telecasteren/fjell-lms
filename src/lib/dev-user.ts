import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

export async function createDevUser() {
  try {
    // Check if dev user already exists
    const existing = await prisma.user.findUnique({
      where: { email: "fox-author-dev@example.com" },
    });

    if (existing) {
      console.log("Dev user already exists");
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
        email: "fox-author-dev@example.com",
        passwordHash: passwordHash,
        role: Role.AUTHOR,
        departmentId: department.id,
      },
    });

    console.log("Dev user created:", devUser.email);
    return devUser;
  } catch (error) {
    console.error("Error creating dev user:", error);
    throw error;
  }
}
