/*
  Warnings:

  - Made the column `gender` on table `employees` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "country" DROP DEFAULT;
