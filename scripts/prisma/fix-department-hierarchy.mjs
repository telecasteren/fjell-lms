import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDepartmentHierarchy() {
  try {
    console.log("Checking department hierarchy...\n");

    // Get all departments
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        parentDepartmentId: true,
      },
      orderBy: { name: "asc" },
    });

    console.log("Current departments:");
    departments.forEach((dept) => {
      console.log(`  - ${dept.name} (ID: ${dept.id})`);
      console.log(`    Parent: ${dept.parentDepartmentId || "None (root)"}`);
    });

    // Find FJELL-LMS department
    const FJELLLms = departments.find((d) => d.name === "FJELL-LMS");

    if (!FJELLLms) {
      console.log("\n❌ FJELL-LMS department not found!");
      console.log("Please create FJELL-LMS department first.");
      return;
    }

    console.log(`\n✓ Found FJELL-LMS department (ID: ${FJELLLms.id})`);

    // Ensure FJELL-LMS has no parent (it's the root)
    if (FJELLLms.parentDepartmentId !== null) {
      console.log("\n⚠️  FJELL-LMS has a parent. Fixing...");
      await prisma.department.update({
        where: { id: FJELLLms.id },
        data: { parentDepartmentId: null },
      });
      console.log("✓ FJELL-LMS is now the root department (no parent)");
    } else {
      console.log("✓ FJELL-LMS is already the root department");
    }

    // Find other departments (excluding FJELL-LMS)
    const otherDepartments = departments.filter((d) => d.name !== "FJELL-LMS");

    console.log(`\nFound ${otherDepartments.length} other department(s):`);
    otherDepartments.forEach((dept) => {
      console.log(`  - ${dept.name}`);
    });

    // Update other departments to have FJELL-LMS as parent
    let updatedCount = 0;
    for (const dept of otherDepartments) {
      if (dept.parentDepartmentId !== FJELLLms.id) {
        console.log(
          `\n⚠️  Updating ${dept.name} to have FJELL-LMS as parent...`,
        );
        await prisma.department.update({
          where: { id: dept.id },
          data: { parentDepartmentId: FJELLLms.id },
        });
        updatedCount++;
        console.log(`✓ ${dept.name} is now a child of FJELL-LMS`);
      } else {
        console.log(`✓ ${dept.name} already has FJELL-LMS as parent`);
      }
    }

    console.log(`\n✅ Department hierarchy fixed!`);
    console.log(`   Updated ${updatedCount} department(s)`);

    // Display final hierarchy
    console.log("\nFinal hierarchy:");
    const finalDepartments = await prisma.department.findMany({
      include: {
        parentDepartment: {
          select: { name: true },
        },
        subDepartments: {
          select: { name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    finalDepartments.forEach((dept) => {
      if (!dept.parentDepartmentId) {
        console.log(`\n📁 ${dept.name} (ROOT)`);
        if (dept.subDepartments.length > 0) {
          dept.subDepartments.forEach((sub) => {
            console.log(`   └── ${sub.name}`);
          });
        }
      }
    });
  } catch (error) {
    console.error("Error fixing department hierarchy:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixDepartmentHierarchy();
