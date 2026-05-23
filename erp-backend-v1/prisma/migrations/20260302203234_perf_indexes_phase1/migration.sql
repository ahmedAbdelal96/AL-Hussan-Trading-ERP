-- CreateIndex
CREATE INDEX "assets_deleted_at_category_status_idx" ON "assets"("deleted_at", "category", "status");

-- CreateIndex
CREATE INDEX "assets_deleted_at_warranty_expiry_idx" ON "assets"("deleted_at", "warranty_expiry");

-- CreateIndex
CREATE INDEX "assets_deleted_at_purchase_date_idx" ON "assets"("deleted_at", "purchase_date");

-- CreateIndex
CREATE INDEX "assets_deleted_at_purchase_price_idx" ON "assets"("deleted_at", "purchase_price");

-- CreateIndex
CREATE INDEX "assets_deleted_at_status_updated_at_idx" ON "assets"("deleted_at", "status", "updated_at");

-- CreateIndex
CREATE INDEX "costs_project_id_idx" ON "costs"("project_id");

-- CreateIndex
CREATE INDEX "costs_cost_type_transaction_date_idx" ON "costs"("cost_type", "transaction_date" DESC);

-- CreateIndex
CREATE INDEX "costs_category_id_transaction_date_idx" ON "costs"("category_id", "transaction_date" DESC);

-- CreateIndex
CREATE INDEX "costs_payment_status_transaction_date_idx" ON "costs"("payment_status", "transaction_date" DESC);

-- CreateIndex
CREATE INDEX "costs_created_at_idx" ON "costs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "maintenance_requests_status_scheduled_date_idx" ON "maintenance_requests"("status", "scheduled_date");

-- CreateIndex
CREATE INDEX "maintenance_requests_created_at_idx" ON "maintenance_requests"("created_at");

-- CreateIndex
CREATE INDEX "maintenance_requests_status_completed_at_started_at_idx" ON "maintenance_requests"("status", "completed_at", "started_at");

-- CreateIndex
CREATE INDEX "projects_deleted_at_status_planned_end_date_idx" ON "projects"("deleted_at", "status", "planned_end_date");

-- CreateIndex
CREATE INDEX "projects_deleted_at_site_id_idx" ON "projects"("deleted_at", "site_id");

-- CreateIndex
CREATE INDEX "projects_deleted_at_actual_start_date_idx" ON "projects"("deleted_at", "actual_start_date");

-- CreateIndex
CREATE INDEX "projects_deleted_at_actual_end_date_idx" ON "projects"("deleted_at", "actual_end_date");

-- CreateIndex
CREATE INDEX "user_custom_permissions_user_id_is_active_expires_at_idx" ON "user_custom_permissions"("user_id", "is_active", "expires_at");

-- CreateIndex
CREATE INDEX "user_roles_user_id_is_active_expires_at_idx" ON "user_roles"("user_id", "is_active", "expires_at");
