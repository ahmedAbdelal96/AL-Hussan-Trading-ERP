/*
  Warnings:

  - The values [ACTIVE,SUSPENDED,CANCELLED,EXPIRED] on the enum `allowance_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,PAID_OFF,DEFAULTED] on the enum `loan_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cancelled_at` on the `employee_allowances` table. All the data in the column will be lost.
  - You are about to drop the column `cancelled_by` on the `employee_allowances` table. All the data in the column will be lost.
  - You are about to drop the column `cancelled_reason` on the `employee_allowances` table. All the data in the column will be lost.
  - You are about to drop the column `suspended_at` on the `employee_allowances` table. All the data in the column will be lost.
  - You are about to drop the column `suspended_by` on the `employee_allowances` table. All the data in the column will be lost.
  - You are about to drop the column `suspended_reason` on the `employee_allowances` table. All the data in the column will be lost.
  - You are about to drop the `project_costs` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "allowance_status_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."employee_allowances" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "employee_allowances" ALTER COLUMN "status" TYPE "allowance_status_new" USING ("status"::text::"allowance_status_new");
ALTER TYPE "allowance_status" RENAME TO "allowance_status_old";
ALTER TYPE "allowance_status_new" RENAME TO "allowance_status";
DROP TYPE "public"."allowance_status_old";
ALTER TABLE "employee_allowances" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "loan_status_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."employee_loans" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "employee_loans" ALTER COLUMN "status" TYPE "loan_status_new" USING ("status"::text::"loan_status_new");
ALTER TYPE "loan_status" RENAME TO "loan_status_old";
ALTER TYPE "loan_status_new" RENAME TO "loan_status";
DROP TYPE "public"."loan_status_old";
ALTER TABLE "employee_loans" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "project_costs" DROP CONSTRAINT "project_costs_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "project_costs" DROP CONSTRAINT "project_costs_category_id_fkey";

-- DropForeignKey
ALTER TABLE "project_costs" DROP CONSTRAINT "project_costs_created_by_fkey";

-- DropForeignKey
ALTER TABLE "project_costs" DROP CONSTRAINT "project_costs_project_id_fkey";

-- AlterTable
ALTER TABLE "employee_allowances" DROP COLUMN "cancelled_at",
DROP COLUMN "cancelled_by",
DROP COLUMN "cancelled_reason",
DROP COLUMN "suspended_at",
DROP COLUMN "suspended_by",
DROP COLUMN "suspended_reason";

-- DropTable
DROP TABLE "project_costs";

-- CreateTable
CREATE TABLE "costs" (
    "id" UUID NOT NULL,
    "project_id" UUID,
    "is_allocated" BOOLEAN NOT NULL DEFAULT false,
    "cost_type" "cost_type" NOT NULL,
    "reference_type" VARCHAR(100),
    "reference_id" UUID,
    "category_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'SAR',
    "transaction_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "invoice_number" VARCHAR(100),
    "payment_status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "paid_date" DATE,
    "payment_method" VARCHAR(50),
    "payment_reference" VARCHAR(100),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "rejected_reason" TEXT,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_allocations" (
    "id" UUID NOT NULL,
    "cost_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "allocated_amount" DECIMAL(12,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cost_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "costs_project_id_transaction_date_idx" ON "costs"("project_id", "transaction_date" DESC);

-- CreateIndex
CREATE INDEX "costs_cost_type_project_id_idx" ON "costs"("cost_type", "project_id");

-- CreateIndex
CREATE INDEX "costs_reference_type_reference_id_idx" ON "costs"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "costs_payment_status_idx" ON "costs"("payment_status");

-- CreateIndex
CREATE INDEX "cost_allocations_cost_id_idx" ON "cost_allocations"("cost_id");

-- CreateIndex
CREATE INDEX "cost_allocations_project_id_idx" ON "cost_allocations"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_allocations_cost_id_project_id_key" ON "cost_allocations"("cost_id", "project_id");

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cost_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costs" ADD CONSTRAINT "costs_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_allocations" ADD CONSTRAINT "cost_allocations_cost_id_fkey" FOREIGN KEY ("cost_id") REFERENCES "costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_allocations" ADD CONSTRAINT "cost_allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
