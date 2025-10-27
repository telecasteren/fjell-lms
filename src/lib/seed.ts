import { prisma } from "./prisma";

export async function seedDefaultDepartment() {
  try {
    // Create default Cubit department if it doesn't exist
    await prisma.department.upsert({
      where: { name: "Cubit" },
      update: {},
      create: { name: "Cubit" },
    });
    console.log("Default department 'Cubit' ensured");
  } catch {
    console.error("Error seeding default department:", error);
  }
}
