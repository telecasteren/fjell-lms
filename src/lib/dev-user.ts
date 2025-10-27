import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

export async function createDevUser() {
  try {
    // Check if dev user already exists
    const existing = await prisma.user.findUnique({
      where: { email: "fox-author-dev@cubit.no" },
    });

    if (existing) {
      console.log("Dev user already exists");
      return existing;
    }

    // Ensure Cubit department exists
    const department = await prisma.department.upsert({
      where: { name: "Cubit" },
      update: {},
      create: { name: "Cubit" },
    });

    // Create dev user with Author role
    const passwordHash = await bcrypt.hash("dev123", 10);
    const devUser = await prisma.user.create({
      data: {
        name: "Fox Author Dev",
        email: "fox-author-dev@cubit.no",
        passwordHash: passwordHash,
        role: Role.AUTHOR,
        departmentId: department.id,
      },
    });

    console.log("Dev user created:", devUser.email);
    return devUser;
  } catch {
    console.error("Error creating dev user:", error);
    throw error;
  }
}
