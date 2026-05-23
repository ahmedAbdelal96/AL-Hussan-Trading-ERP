-- CreateIndex
CREATE INDEX "employee_deductions_loan_id_deduction_date_idx" ON "employee_deductions"("loan_id", "deduction_date");
