import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log("Creating test users...");

    // First, ensure the Cubit department exists
    let cubitDepartment = await prisma.department.findUnique({
      where: { name: "Cubit" },
    });

    if (!cubitDepartment) {
      cubitDepartment = await prisma.department.create({
        data: {
          name: "Cubit",
          orgNr: "123456789",
        },
      });
      console.log("Created Cubit department");
    } else {
      console.log("Cubit department already exists");
    }

    // Hash the password
    const passwordHash = await bcrypt.hash("test321", 10);

    // Create test users
    const testUsers = [
      {
        email: "author@cubit.no",
        name: "Test Author",
        role: "AUTHOR",
        passwordHash,
      },
      {
        email: "admin@cubit.no",
        name: "Test Admin",
        role: "ADMIN",
        passwordHash,
      },
      {
        email: "basic@cubit.no",
        name: "Test Basic",
        role: "BASIC",
        passwordHash,
      },
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating...`);
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            name: userData.name,
            role: userData.role,
            passwordHash: userData.passwordHash,
            departmentId: cubitDepartment.id,
          },
        });
      } else {
        console.log(`Creating user ${userData.email}...`);
        await prisma.user.create({
          data: {
            ...userData,
            departmentId: cubitDepartment.id,
          },
        });
      }
    }

    console.log("✅ Test users created successfully!");
    console.log("Users:");
    console.log("- author@cubit.no (AUTHOR)");
    console.log("- admin@cubit.no (ADMIN)");
    console.log("- basic@cubit.no (BASIC)");
    console.log("Password for all: test321");
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
