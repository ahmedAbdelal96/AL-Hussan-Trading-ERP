-- AlterTable
ALTER TABLE "employee_allowances" ADD COLUMN     "deleted_at" TIMESTAMPTZ(3),
ADD COLUMN     "deleted_by" UUID;

-- AlterTable
ALTER TABLE "employee_deductions" ADD COLUMN     "deleted_at" TIMESTAMPTZ(3),
ADD COLUMN     "deleted_by" UUID;

-- AlterTable
ALTER TABLE "employee_loans" ADD COLUMN     "deleted_at" TIMESTAMPTZ(3),
ADD COLUMN     "deleted_by" UUID;

-- Create Partial Indexes for Performance (Only index active/non-deleted records)
-- These indexes dramatically improve query performance by excluding soft-deleted data

-- Index for active allowances (most frequent query pattern)
CREATE INDEX "idx_active_allowances" ON "employee_allowances"("employee_id", "status", "effective_from") 
WHERE "deleted_at" IS NULL;

-- Index for active deductions (used in payroll calculations)
CREATE INDEX "idx_active_deductions" ON "employee_deductions"("employee_id", "deduction_date") 
WHERE "deleted_at" IS NULL;

-- Index for active loans (used in payment tracking)
CREATE INDEX "idx_active_loans" ON "employee_loans"("employee_id", "status", "end_date") 
WHERE "deleted_at" IS NULL;
