-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "name_ar" VARCHAR(100);

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "name_ar" VARCHAR(100);
