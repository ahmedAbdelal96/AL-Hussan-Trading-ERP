-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "employment_type" ADD VALUE 'TEMPORARY';
ALTER TYPE "employment_type" ADD VALUE 'FULL_TIME';
ALTER TYPE "employment_type" ADD VALUE 'CONSULTANT';
ALTER TYPE "employment_type" ADD VALUE 'INTERN';
ALTER TYPE "employment_type" ADD VALUE 'TRAINEE';
ALTER TYPE "employment_type" ADD VALUE 'SEASONAL';
ALTER TYPE "employment_type" ADD VALUE 'ON_CALL';
ALTER TYPE "employment_type" ADD VALUE 'PROBATION';
ALTER TYPE "employment_type" ADD VALUE 'REMOTE';

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_action_created_at_idx" ON "audit_logs"("resource_type", "action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_user_email_created_at_idx" ON "audit_logs"("user_email", "created_at" DESC);
