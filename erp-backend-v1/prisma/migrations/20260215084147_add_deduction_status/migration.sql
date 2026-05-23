-- CreateEnum
CREATE TYPE "deduction_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "employee_deductions" ADD COLUMN     "rejected_at" TIMESTAMPTZ(3),
ADD COLUMN     "rejected_by" UUID,
ADD COLUMN     "rejected_reason" TEXT,
ADD COLUMN     "status" "deduction_status" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "employee_deductions_employee_id_status_idx" ON "employee_deductions"("employee_id", "status");

-- CreateIndex
CREATE INDEX "employee_deductions_status_idx" ON "employee_deductions"("status");
