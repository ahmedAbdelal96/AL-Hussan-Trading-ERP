-- AlterTable: Remove nameAr column from cost_categories
ALTER TABLE "cost_categories" DROP COLUMN IF EXISTS "name_ar";
