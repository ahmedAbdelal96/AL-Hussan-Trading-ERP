-- CreateTable
CREATE TABLE "payslips" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "pay_period_month" INTEGER NOT NULL,
    "pay_period_year" INTEGER NOT NULL,
    "pay_date" DATE NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL,
    "housing_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "transport_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "food_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "other_allowances" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_allowances" DECIMAL(12,2) NOT NULL,
    "gross_salary" DECIMAL(12,2) NOT NULL,
    "insurance_deduction" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_deduction" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "loan_deduction" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "absence_deduction" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "other_deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(12,2) NOT NULL,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "working_days" INTEGER NOT NULL DEFAULT 0,
    "absent_days" INTEGER NOT NULL DEFAULT 0,
    "overtime_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "overtime_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "payment_notes" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMPTZ(3),
    "paid_by" UUID,
    "pay_method" VARCHAR(50),
    "processed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");

-- CreateIndex
CREATE INDEX "payslips_pay_period_month_pay_period_year_idx" ON "payslips"("pay_period_month", "pay_period_year");

-- CreateIndex
CREATE INDEX "payslips_pay_date_idx" ON "payslips"("pay_date");

-- CreateIndex
CREATE INDEX "payslips_is_paid_idx" ON "payslips"("is_paid");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_employee_id_pay_period_month_pay_period_year_key" ON "payslips"("employee_id", "pay_period_month", "pay_period_year");

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
