-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "global" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Course_global_idx" ON "Course"("global");
