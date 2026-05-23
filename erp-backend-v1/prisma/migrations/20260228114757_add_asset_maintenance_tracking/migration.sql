-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "last_maintenance_date" TIMESTAMPTZ(3),
ADD COLUMN     "previous_status" "asset_status";
