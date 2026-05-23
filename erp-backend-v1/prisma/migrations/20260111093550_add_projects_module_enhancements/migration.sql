-- CreateEnum
CREATE TYPE "media_category" AS ENUM ('PROGRESS_PHOTO', 'PLAN', 'REPORT', 'INVOICE', 'CONTRACT', 'CERTIFICATE', 'OTHER');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "client_email" VARCHAR(255),
ADD COLUMN     "client_name" VARCHAR(255),
ADD COLUMN     "client_phone" VARCHAR(20),
ADD COLUMN     "last_progress_update" TIMESTAMPTZ(3),
ADD COLUMN     "progress_notes" TEXT,
ADD COLUMN     "project_code" VARCHAR(50);

-- CreateTable
CREATE TABLE "project_media" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "category" "media_category" NOT NULL DEFAULT 'OTHER',
    "title" VARCHAR(255),
    "description" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "captured_at" TIMESTAMPTZ(3),
    "display_order" INTEGER,
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by" UUID,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "project_media_pkey" PRIMARY KEY ("id")
);

-- Update existing projects to have unique project codes
DO $$
DECLARE
    counter INT := 1;
    project_record RECORD;
BEGIN
    FOR project_record IN
        SELECT id FROM projects ORDER BY created_at ASC
    LOOP
        UPDATE projects
        SET project_code = 'PRJ-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = project_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Make project_code NOT NULL and UNIQUE after setting values
ALTER TABLE "projects" ALTER COLUMN "project_code" SET NOT NULL;
CREATE UNIQUE INDEX "projects_project_code_key" ON "projects"("project_code");

-- CreateIndex
CREATE INDEX "project_media_project_id_category_idx" ON "project_media"("project_id", "category");

-- CreateIndex
CREATE INDEX "project_media_project_id_uploaded_at_idx" ON "project_media"("project_id", "uploaded_at" DESC);

-- CreateIndex
CREATE INDEX "project_media_category_idx" ON "project_media"("category");

-- CreateIndex
CREATE INDEX "project_media_deleted_at_idx" ON "project_media"("deleted_at");

-- CreateIndex
CREATE INDEX "projects_project_code_idx" ON "projects"("project_code");

-- CreateIndex
CREATE INDEX "projects_client_name_idx" ON "projects"("client_name");

-- AddForeignKey
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
