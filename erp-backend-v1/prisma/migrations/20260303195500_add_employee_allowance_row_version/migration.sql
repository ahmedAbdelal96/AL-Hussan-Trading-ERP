-- Add row_version for optimistic concurrency on employee allowances
ALTER TABLE "public"."employee_allowances"
ADD COLUMN IF NOT EXISTS "row_version" INTEGER NOT NULL DEFAULT 1;
