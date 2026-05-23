-- Add row_version for optimistic concurrency on departments and positions
ALTER TABLE "public"."departments"
ADD COLUMN IF NOT EXISTS "row_version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "public"."positions"
ADD COLUMN IF NOT EXISTS "row_version" INTEGER NOT NULL DEFAULT 1;
