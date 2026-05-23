-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "base_salary" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "currency" VARCHAR(3) DEFAULT 'SAR',
ADD COLUMN     "last_salary_update" TIMESTAMPTZ(3),
ADD COLUMN     "last_salary_update_by" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "salary_history" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "base_salary_before" DECIMAL(12,2) NOT NULL,
    "base_salary_after" DECIMAL(12,2) NOT NULL,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" UUID NOT NULL,
    "reason" VARCHAR(500),
    "source" VARCHAR(50) NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "salary_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_history_employee_id_changed_at_idx" ON "salary_history"("employee_id", "changed_at" DESC);

-- CreateIndex
CREATE INDEX "salary_history_changed_at_idx" ON "salary_history"("changed_at" DESC);

-- CreateIndex
CREATE INDEX "salary_history_changed_by_idx" ON "salary_history"("changed_by");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_last_salary_update_by_fkey" FOREIGN KEY ("last_salary_update_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_history" ADD CONSTRAINT "salary_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_history" ADD CONSTRAINT "salary_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
