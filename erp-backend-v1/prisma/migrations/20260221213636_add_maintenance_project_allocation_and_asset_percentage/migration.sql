-- AlterTable
ALTER TABLE "project_assets" ADD COLUMN     "percentage" DECIMAL(5,2) NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "maintenance_project_allocations" (
    "id" UUID NOT NULL,
    "maintenance_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "allocated_amount" DECIMAL(12,2),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "maintenance_project_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_project_allocations_maintenance_id_idx" ON "maintenance_project_allocations"("maintenance_id");

-- CreateIndex
CREATE INDEX "maintenance_project_allocations_project_id_idx" ON "maintenance_project_allocations"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_project_allocations_maintenance_id_project_id_key" ON "maintenance_project_allocations"("maintenance_id", "project_id");

-- AddForeignKey
ALTER TABLE "maintenance_project_allocations" ADD CONSTRAINT "maintenance_project_allocations_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_project_allocations" ADD CONSTRAINT "maintenance_project_allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
