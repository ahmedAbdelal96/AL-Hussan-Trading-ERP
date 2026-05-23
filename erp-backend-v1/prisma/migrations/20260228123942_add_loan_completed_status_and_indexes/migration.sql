-- AlterEnum
ALTER TYPE "loan_status" ADD VALUE 'COMPLETED';

-- CreateIndex
CREATE INDEX "employee_allowances_employee_id_status_effective_from_effec_idx" ON "employee_allowances"("employee_id", "status", "effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "employee_deductions_employee_id_status_deduction_date_idx" ON "employee_deductions"("employee_id", "status", "deduction_date");

-- CreateIndex
CREATE INDEX "employee_loans_employee_id_status_start_date_end_date_idx" ON "employee_loans"("employee_id", "status", "start_date", "end_date");
