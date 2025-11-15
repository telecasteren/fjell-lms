import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createGodmodeUser() {
  try {
    const email = "fox-author@dev.no";
    const password = "dev123";
    const name = "Fox Author (Godmode)";
    const role = "AUTHOR";

    console.log(
      `Creating godmode user for environment: ${process.env.NODE_ENV || "development"}`,
    );

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(
        `✅ Godmode user already exists: ${existing.email} (${existing.role})`,
      );
      return existing;
    }

    // Ensure FOX-LMS department exists
    const department = await prisma.department.upsert({
      where: { name: "FOX-LMS" },
      update: {},
      create: { name: "FOX-LMS", orgNr: "999999999" },
    });

    // Create godmode user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        departmentId: department.id,
      },
    });

    console.log("🚀 Godmode user created successfully!");
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Password: ${password}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `Database: ${process.env.DATABASE_URL ? "[CONNECTED]" : "[LOCAL]"}`,
    );

    return user;
  } catch (error) {
    console.error("❌ Error creating godmode user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createGodmodeUser();
