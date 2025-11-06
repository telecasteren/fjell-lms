const { PrismaClient } = require('@prisma/client');

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
    departments.forEach(dept => {
      console.log(`  - ${dept.name} (ID: ${dept.id})`);
      console.log(`    Parent: ${dept.parentDepartmentId || "None (root)"}`);
    });

    // Find FOX-LMS department
    const foxLms = departments.find(d => d.name === "FOX-LMS");
    
    if (!foxLms) {
      console.log("\n❌ FOX-LMS department not found!");
      console.log("Please create FOX-LMS department first.");
      return;
    }

    console.log(`\n✓ Found FOX-LMS department (ID: ${foxLms.id})`);

    // Ensure FOX-LMS has no parent (it's the root)
    if (foxLms.parentDepartmentId !== null) {
      console.log("\n⚠️  FOX-LMS has a parent. Fixing...");
      await prisma.department.update({
        where: { id: foxLms.id },
        data: { parentDepartmentId: null },
      });
      console.log("✓ FOX-LMS is now the root department (no parent)");
    } else {
      console.log("✓ FOX-LMS is already the root department");
    }

    // Find other departments (excluding FOX-LMS)
    const otherDepartments = departments.filter(d => d.name !== "FOX-LMS");
    
    console.log(`\nFound ${otherDepartments.length} other department(s):`);
    otherDepartments.forEach(dept => {
      console.log(`  - ${dept.name}`);
    });

    // Update other departments to have FOX-LMS as parent
    let updatedCount = 0;
    for (const dept of otherDepartments) {
      if (dept.parentDepartmentId !== foxLms.id) {
        console.log(`\n⚠️  Updating ${dept.name} to have FOX-LMS as parent...`);
        await prisma.department.update({
          where: { id: dept.id },
          data: { parentDepartmentId: foxLms.id },
        });
        updatedCount++;
        console.log(`✓ ${dept.name} is now a child of FOX-LMS`);
      } else {
        console.log(`✓ ${dept.name} already has FOX-LMS as parent`);
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

    finalDepartments.forEach(dept => {
      if (!dept.parentDepartmentId) {
        console.log(`\n📁 ${dept.name} (ROOT)`);
        if (dept.subDepartments.length > 0) {
          dept.subDepartments.forEach(sub => {
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

