-- Add request correlation + duration tracking for audit logs
ALTER TABLE "audit_logs"
  ADD COLUMN "request_id" VARCHAR(100),
  ADD COLUMN "duration_ms" INTEGER;

-- Fast lookup by request id when investigating incidents
CREATE INDEX "audit_logs_request_id_created_at_idx"
  ON "audit_logs"("request_id", "created_at" DESC);

