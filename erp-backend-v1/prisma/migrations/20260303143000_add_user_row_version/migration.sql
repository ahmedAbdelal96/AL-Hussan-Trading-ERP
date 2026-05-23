-- Add optimistic locking column for users module
ALTER TABLE "public"."users"
ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;

