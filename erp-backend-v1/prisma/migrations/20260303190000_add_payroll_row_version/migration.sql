ALTER TABLE "public"."allowance_types"
ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "public"."employee_loans"
ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "public"."employee_deductions"
ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 1;
