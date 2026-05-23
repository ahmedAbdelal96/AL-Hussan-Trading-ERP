/*
  Warnings:

  - You are about to drop the column `is_active` on the `employee_allowances` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employee_id,allowance_type_id,status]` on the table `employee_allowances` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "allowance_status" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'REJECTED', 'EXPIRED');

-- DropIndex
DROP INDEX "employee_allowances_employee_id_allowance_type_id_is_active_key";

-- DropIndex
DROP INDEX "employee_allowances_employee_id_is_active_idx";

-- AlterTable
ALTER TABLE "employee_allowances" DROP COLUMN "is_active",
ADD COLUMN     "cancelled_at" TIMESTAMPTZ(3),
ADD COLUMN     "cancelled_by" UUID,
ADD COLUMN     "cancelled_reason" TEXT,
ADD COLUMN     "rejected_at" TIMESTAMPTZ(3),
ADD COLUMN     "rejected_by" UUID,
ADD COLUMN     "rejected_reason" TEXT,
ADD COLUMN     "status" "allowance_status" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "suspended_at" TIMESTAMPTZ(3),
ADD COLUMN     "suspended_by" UUID,
ADD COLUMN     "suspended_reason" TEXT;

-- CreateIndex
CREATE INDEX "employee_allowances_employee_id_status_idx" ON "employee_allowances"("employee_id", "status");

-- CreateIndex
CREATE INDEX "employee_allowances_status_idx" ON "employee_allowances"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_allowances_employee_id_allowance_type_id_status_key" ON "employee_allowances"("employee_id", "allowance_type_id", "status");
