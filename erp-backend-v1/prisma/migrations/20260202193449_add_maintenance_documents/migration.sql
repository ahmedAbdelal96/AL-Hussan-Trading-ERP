-- CreateTable
CREATE TABLE "maintenance_documents" (
    "id" UUID NOT NULL,
    "maintenance_id" UUID NOT NULL,
    "document_type" "document_type" NOT NULL,
    "document_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "issue_date" DATE,
    "expiry_date" DATE,
    "notes" TEXT,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_documents_maintenance_id_idx" ON "maintenance_documents"("maintenance_id");

-- CreateIndex
CREATE INDEX "maintenance_documents_expiry_date_idx" ON "maintenance_documents"("expiry_date");

-- AddForeignKey
ALTER TABLE "maintenance_documents" ADD CONSTRAINT "maintenance_documents_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
