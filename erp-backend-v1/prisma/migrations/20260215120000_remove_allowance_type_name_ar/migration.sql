-- Merge: copy Arabic name into name field (user prefers Arabic)
-- Use name_ar as primary name since company uses Arabic
UPDATE "allowance_types"
SET "name" = "name_ar"
WHERE "name_ar" IS NOT NULL AND "name_ar" != '';

-- Drop the name_ar column
ALTER TABLE "allowance_types" DROP COLUMN IF EXISTS "name_ar";
