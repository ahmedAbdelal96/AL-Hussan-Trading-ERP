-- CreateEnum
CREATE TYPE "site_status" AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_PREPARATION', 'CLOSED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "site_id" UUID;

-- CreateTable
CREATE TABLE "sites" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "name_ar" VARCHAR(255),
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100) NOT NULL DEFAULT 'المملكه العربيه السعوديه',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "status" "site_status" NOT NULL DEFAULT 'ACTIVE',
    "area" DECIMAL(10,2),
    "capacity" INTEGER,
    "contact_person" VARCHAR(100),
    "contact_phone" VARCHAR(20),
    "contact_email" VARCHAR(100),
    "notes" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sites_code_key" ON "sites"("code");

-- CreateIndex
CREATE INDEX "sites_code_idx" ON "sites"("code");

-- CreateIndex
CREATE INDEX "sites_status_idx" ON "sites"("status");

-- CreateIndex
CREATE INDEX "sites_city_country_idx" ON "sites"("city", "country");

-- CreateIndex
CREATE INDEX "sites_deleted_at_idx" ON "sites"("deleted_at");

-- CreateIndex
CREATE INDEX "projects_site_id_idx" ON "projects"("site_id");

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
