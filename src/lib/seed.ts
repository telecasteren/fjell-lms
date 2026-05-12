import { prisma } from "./prisma";

export async function seedDefaultDepartment() {
  try {
    // Create default department if it doesn't exist
    // Note: This is a generic placeholder - actual departments should be created through the admin interface
    await prisma.department.upsert({
      where: { name: "FOX-LMS" },
      update: {},
      create: { name: "FOX-LMS" },
    });
    console.log("Default department 'FOX-LMS' ensured");
  } catch (error) {
    console.error("Error seeding default department:", error);
  }
}
