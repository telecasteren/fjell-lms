import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log("Creating test users...");

    // First, ensure FOX-LMS department exists (root department)
    let testDepartment = await prisma.department.findUnique({
      where: { name: "FOX-LMS" },
    });

    if (!testDepartment) {
      testDepartment = await prisma.department.create({
        data: {
          name: "FOX-LMS",
          orgNr: "123456789",
        },
      });
      console.log("Created FOX-LMS department");
    } else {
      console.log("FOX-LMS department already exists");
    }

    // Hash the password
    const passwordHash = await bcrypt.hash("test321", 10);

    // Create test users
    const testUsers = [
      {
        email: "author@example.com",
        name: "Test Author",
        role: "AUTHOR",
        passwordHash,
      },
      {
        email: "admin@example.com",
        name: "Test Admin",
        role: "ADMIN",
        passwordHash,
      },
      {
        email: "basic@example.com",
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
            departmentId: testDepartment.id,
          },
        });
      } else {
        console.log(`Creating user ${userData.email}...`);
        await prisma.user.create({
          data: {
            ...userData,
            departmentId: testDepartment.id,
          },
        });
      }
    }

    console.log("✅ Test users created successfully!");
    console.log("Users:");
    console.log("- author@example.com (AUTHOR)");
    console.log("- admin@example.com (ADMIN)");
    console.log("- basic@example.com (BASIC)");
    console.log("Password for all: test321");
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
