-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "audit_action" ADD VALUE 'ASSIGN_ROLE';
ALTER TYPE "audit_action" ADD VALUE 'REVOKE_ROLE';
ALTER TYPE "audit_action" ADD VALUE 'GRANT_CUSTOM_PERMISSION';
ALTER TYPE "audit_action" ADD VALUE 'REVOKE_CUSTOM_PERMISSION';
