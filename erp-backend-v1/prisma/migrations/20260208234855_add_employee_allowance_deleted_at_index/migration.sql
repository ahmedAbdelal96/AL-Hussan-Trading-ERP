-- CreateIndex with partial index for better performance on active (non-deleted) records
CREATE INDEX "employee_allowances_employee_id_deleted_at_idx" ON "employee_allowances"("employee_id", "deleted_at");

-- CreateIndex for active allowances only (partial index where deleted_at IS NULL)
CREATE INDEX "employee_allowances_employee_id_active_idx" ON "employee_allowances"("employee_id") WHERE "deleted_at" IS NULL;

