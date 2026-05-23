-- Add tax decomposition fields for costs without changing existing amount semantics.
ALTER TABLE "costs"
ADD COLUMN "amount_before_tax" DECIMAL(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN "tax_rate" DECIMAL(5, 2) NOT NULL DEFAULT 0,
ADD COLUMN "tax_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Backfill existing rows: old amount is treated as total amount.
UPDATE "costs"
SET "amount_before_tax" = "amount"
WHERE "amount_before_tax" = 0;
