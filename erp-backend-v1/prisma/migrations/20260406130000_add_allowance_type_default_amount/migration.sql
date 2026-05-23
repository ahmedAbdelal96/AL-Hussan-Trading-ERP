-- Add default amount for allowance type templates
ALTER TABLE "allowance_types"
ADD COLUMN "default_amount" DECIMAL(10, 2);
