/*
  Warnings:

  - A unique constraint covering the columns `[maintenance_number]` on the table `maintenance_requests` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `maintenance_number` to the `maintenance_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "maintenance_requests" ADD COLUMN     "maintenance_number" VARCHAR(50) NOT NULL,
ADD COLUMN     "project_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_requests_maintenance_number_key" ON "maintenance_requests"("maintenance_number");

-- CreateIndex
CREATE INDEX "maintenance_requests_maintenance_number_idx" ON "maintenance_requests"("maintenance_number");

-- CreateIndex
CREATE INDEX "maintenance_requests_project_id_status_idx" ON "maintenance_requests"("project_id", "status");

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
