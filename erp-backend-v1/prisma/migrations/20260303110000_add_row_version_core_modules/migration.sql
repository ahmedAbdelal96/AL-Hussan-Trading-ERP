-- Add row_version columns for optimistic concurrency control
ALTER TABLE "sites" ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "projects" ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "assets" ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "maintenance_requests" ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "cost_categories" ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "costs" ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;
