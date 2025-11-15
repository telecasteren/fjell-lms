import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("Checking if appDescription column exists...");

    // Check if column exists
    const result = await prisma.$queryRaw`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='Department'
    `;

    const tableSchema = result[0]?.sql || "";
    const hasColumn = tableSchema.includes("appDescription");

    if (hasColumn) {
      console.log("✅ appDescription column already exists");
      return;
    }

    console.log("Adding appDescription column...");

    // Apply the migration
    await prisma.$executeRaw`
      ALTER TABLE "Department" ADD COLUMN "appDescription" TEXT;
    `;

    console.log("✅ Migration applied successfully!");
    console.log("   Added appDescription column to Department table");
  } catch (error) {
    if (error.message.includes("database is locked")) {
      console.error("❌ Database is locked. Please:");
      console.error("   1. Stop your dev server (Ctrl+C)");
      console.error(
        "   2. Run this script again: node scripts/apply-app-description-migration.mjs",
      );
      console.error("   3. Restart your dev server");
    } else {
      console.error("❌ Error applying migration:", error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
