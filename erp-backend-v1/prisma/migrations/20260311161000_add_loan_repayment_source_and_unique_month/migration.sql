-- Add source field for loan repayment events (manual vs payroll processing)
CREATE TYPE "public"."loan_repayment_source" AS ENUM ('MANUAL', 'PAYROLL_PROCESS');

ALTER TABLE "public"."employee_deductions"
ADD COLUMN "repayment_source" "public"."loan_repayment_source";

-- Backfill existing loan repayment rows as MANUAL (legacy data source unknown).
UPDATE "public"."employee_deductions"
SET "repayment_source" = 'MANUAL'::"public"."loan_repayment_source"
WHERE "deduction_type" = 'LOAN_REPAYMENT'::"public"."deduction_type"
  AND "repayment_source" IS NULL;

-- Enforce one loan repayment event per loan per month (hard DB guard).
CREATE UNIQUE INDEX "uq_employee_deductions_loan_repayment_month"
ON "public"."employee_deductions" (
  "loan_id",
  EXTRACT(YEAR FROM "deduction_date"),
  EXTRACT(MONTH FROM "deduction_date")
)
WHERE "deduction_type" = 'LOAN_REPAYMENT'::"public"."deduction_type"
  AND "deleted_at" IS NULL;
