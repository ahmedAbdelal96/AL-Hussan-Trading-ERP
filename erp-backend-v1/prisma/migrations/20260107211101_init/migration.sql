-- CreateEnum
CREATE TYPE "employment_type" AS ENUM ('PERMANENT', 'CONTRACT', 'FREELANCE', 'PART_TIME');

-- CreateEnum
CREATE TYPE "employee_status" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "asset_type" AS ENUM ('VEHICLE', 'EQUIPMENT', 'MACHINERY', 'TOOL', 'COMPUTER', 'FURNITURE', 'OTHER');

-- CreateEnum
CREATE TYPE "asset_status" AS ENUM ('AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED');

-- CreateEnum
CREATE TYPE "maintenance_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "maintenance_type" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "maintenance_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('DRAFT', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "cost_type" AS ENUM ('MAINTENANCE', 'PURCHASE', 'SALARY', 'ALLOWANCE', 'FUEL', 'MATERIAL', 'EQUIPMENT_RENTAL', 'SUBCONTRACTOR', 'UTILITY', 'TRANSPORTATION', 'INSURANCE', 'TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'PARTIALLY_PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "loan_status" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'PAID_OFF', 'REJECTED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "deduction_type" AS ENUM ('LOAN_REPAYMENT', 'INSURANCE', 'TAX', 'PENALTY', 'ADVANCE_DEDUCTION', 'ABSENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "allowance_frequency" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('ID_CARD', 'PASSPORT', 'DRIVER_LICENSE', 'CONTRACT', 'CERTIFICATE', 'INSURANCE', 'REGISTRATION', 'PERMIT', 'INVOICE', 'RECEIPT', 'PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'RESTORE');

-- CreateEnum
CREATE TYPE "audit_status" AS ENUM ('SUCCESS', 'FAILED', 'UNAUTHORIZED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "permission_type" AS ENUM ('GRANT', 'REVOKE');

-- CreateEnum
CREATE TYPE "assignment_role" AS ENUM ('MANAGER', 'SUPERVISOR', 'WORKER', 'TECHNICIAN', 'ENGINEER', 'FOREMAN', 'SAFETY_OFFICER', 'QUALITY_CONTROL', 'OTHER');

-- CreateEnum
CREATE TYPE "operator_role" AS ENUM ('PRIMARY_DRIVER', 'BACKUP_DRIVER', 'OPERATOR', 'TECHNICIAN', 'ASSISTANT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(3),
    "last_login_ip" INET,
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "user_agent" TEXT,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "is_temporary" BOOLEAN NOT NULL DEFAULT false,
    "granted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),
    "granted_by" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_by" UUID,
    "revoke_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_custom_permissions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "permission_type" "permission_type" NOT NULL DEFAULT 'GRANT',
    "is_temporary" BOOLEAN NOT NULL DEFAULT false,
    "granted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),
    "granted_by" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_custom_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_grant_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" UUID NOT NULL,
    "granted_by" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3),
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_grant_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "national_id" VARCHAR(50) NOT NULL,
    "employee_number" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20) NOT NULL,
    "alternate_phone" VARCHAR(20),
    "date_of_birth" DATE,
    "gender" "gender",
    "nationality" VARCHAR(100),
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100) NOT NULL DEFAULT 'المملكه العربيه السعوديه',
    "employment_type" "employment_type" NOT NULL,
    "status" "employee_status" NOT NULL DEFAULT 'ACTIVE',
    "department" VARCHAR(100),
    "position" VARCHAR(100),
    "hire_date" DATE NOT NULL,
    "termination_date" DATE,
    "termination_reason" TEXT,
    "emergency_contact_name" VARCHAR(200),
    "emergency_contact_phone" VARCHAR(20),
    "emergency_contact_relation" VARCHAR(100),
    "notes" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_contracts" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "contract_type" "employment_type" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_renewable" BOOLEAN NOT NULL DEFAULT false,
    "position" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100),
    "base_salary" DECIMAL(12,2) NOT NULL,
    "contract_terms" TEXT,
    "file_path" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
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

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'SAR',
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allowance_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_ar" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "allowance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_allowances" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "allowance_type_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "allowance_frequency" NOT NULL DEFAULT 'MONTHLY',
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "employee_allowances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_loans" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "remaining_amount" DECIMAL(12,2) NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 0,
    "paid_installments" INTEGER NOT NULL DEFAULT 0,
    "installment_amount" DECIMAL(10,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "loan_status" NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT,
    "notes" TEXT,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "employee_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_deductions" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "deduction_type" "deduction_type" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "deduction_date" DATE NOT NULL,
    "loan_id" UUID,
    "reason" TEXT,
    "notes" TEXT,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "employee_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "name_ar" VARCHAR(255),
    "tender_number" VARCHAR(100),
    "description" TEXT,
    "location" VARCHAR(255),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "status" "project_status" NOT NULL DEFAULT 'PLANNING',
    "planned_start_date" DATE,
    "actual_start_date" DATE,
    "planned_end_date" DATE,
    "actual_end_date" DATE,
    "budget" DECIMAL(15,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'SAR',
    "completion_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "manager_id" UUID,
    "notes" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_employees" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "role" "assignment_role",
    "assigned_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "project_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_assets" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "assigned_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "return_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "location" VARCHAR(255),
    "assigned_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "project_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "asset_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "name_ar" VARCHAR(255),
    "asset_type" "asset_type" NOT NULL,
    "category" VARCHAR(100),
    "manufacturer" VARCHAR(100),
    "model" VARCHAR(100),
    "serial_number" VARCHAR(100),
    "year_of_manufacture" INTEGER,
    "purchase_date" DATE,
    "purchase_price" DECIMAL(12,2),
    "vendor" VARCHAR(255),
    "warranty_expiry" DATE,
    "license_plate" VARCHAR(50),
    "chassis_number" VARCHAR(100),
    "engine_number" VARCHAR(100),
    "color" VARCHAR(50),
    "fuel_type" VARCHAR(50),
    "status" "asset_status" NOT NULL DEFAULT 'AVAILABLE',
    "current_location" VARCHAR(255),
    "current_odometer" INTEGER,
    "specifications" JSONB,
    "description" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_documents" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
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

    CONSTRAINT "asset_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_employees" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "assignment_type" "operator_role" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "asset_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_operations" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "project_id" UUID,
    "operator_id" UUID,
    "start_time" TIMESTAMPTZ(3) NOT NULL,
    "end_time" TIMESTAMPTZ(3),
    "start_odometer" INTEGER,
    "end_odometer" INTEGER,
    "fuel_consumed" DECIMAL(10,2),
    "fuel_cost" DECIMAL(10,2),
    "start_location" VARCHAR(255),
    "end_location" VARCHAR(255),
    "purpose" TEXT,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "asset_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "maintenance_type" "maintenance_type" NOT NULL,
    "priority" "maintenance_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "maintenance_status" NOT NULL DEFAULT 'PENDING',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scheduled_date" TIMESTAMPTZ(3),
    "started_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "estimated_cost" DECIMAL(10,2),
    "actual_cost" DECIMAL(10,2),
    "vendor" VARCHAR(255),
    "vendor_contact" VARCHAR(100),
    "assigned_to" UUID,
    "odometer_reading" INTEGER,
    "work_performed" TEXT,
    "parts_replaced" TEXT,
    "notes" TEXT,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_attachments" (
    "id" UUID NOT NULL,
    "maintenance_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_ar" VARCHAR(100),
    "description" TEXT,
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cost_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_costs" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "cost_type" "cost_type" NOT NULL,
    "reference_type" VARCHAR(100),
    "reference_id" UUID,
    "category_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'SAR',
    "transaction_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "invoice_number" VARCHAR(100),
    "payment_status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "paid_date" DATE,
    "payment_method" VARCHAR(50),
    "payment_reference" VARCHAR(100),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "rejected_reason" TEXT,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "project_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "user_email" VARCHAR(255),
    "user_name" VARCHAR(200),
    "action" "audit_action" NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_id" UUID,
    "resource_name" VARCHAR(255),
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_fields" TEXT[],
    "ip_address" INET,
    "user_agent" TEXT,
    "request_method" VARCHAR(10),
    "request_url" VARCHAR(500),
    "status" "audit_status" NOT NULL DEFAULT 'SUCCESS',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "storage_type" VARCHAR(20) NOT NULL DEFAULT 'local',
    "bucket" VARCHAR(100),
    "key" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "access_url" VARCHAR(500),
    "expires_at" TIMESTAMPTZ(3),
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_scanned" BOOLEAN NOT NULL DEFAULT false,
    "is_safe" BOOLEAN NOT NULL DEFAULT true,
    "scan_result" TEXT,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "data_type" VARCHAR(20) NOT NULL DEFAULT 'string',
    "category" VARCHAR(50),
    "description" TEXT,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_is_active_idx" ON "users"("email", "is_active");

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_is_revoked_idx" ON "refresh_tokens"("user_id", "is_revoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE INDEX "roles_slug_is_active_idx" ON "roles"("slug", "is_active");

-- CreateIndex
CREATE INDEX "roles_priority_idx" ON "roles"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_resource_action_idx" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "permissions_name_idx" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "user_roles_user_id_is_active_idx" ON "user_roles"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_roles_expires_at_idx" ON "user_roles"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_is_active_key" ON "user_roles"("user_id", "role_id", "is_active");

-- CreateIndex
CREATE INDEX "user_custom_permissions_user_id_is_active_idx" ON "user_custom_permissions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_custom_permissions_expires_at_idx" ON "user_custom_permissions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_custom_permissions_user_id_permission_id_is_active_key" ON "user_custom_permissions"("user_id", "permission_id", "is_active");

-- CreateIndex
CREATE INDEX "permission_grant_history_user_id_created_at_idx" ON "permission_grant_history"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "permission_grant_history_target_type_target_id_idx" ON "permission_grant_history"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_national_id_key" ON "employees"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_employee_number_status_idx" ON "employees"("employee_number", "status");

-- CreateIndex
CREATE INDEX "employees_national_id_status_idx" ON "employees"("national_id", "status");

-- CreateIndex
CREATE INDEX "employees_status_deleted_at_idx" ON "employees"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "employees_employment_type_status_idx" ON "employees"("employment_type", "status");

-- CreateIndex
CREATE INDEX "employees_department_status_idx" ON "employees"("department", "status");

-- CreateIndex
CREATE INDEX "employees_hire_date_idx" ON "employees"("hire_date" DESC);

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employment_contracts_employee_id_is_active_idx" ON "employment_contracts"("employee_id", "is_active");

-- CreateIndex
CREATE INDEX "employment_contracts_start_date_end_date_idx" ON "employment_contracts"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "employee_documents_employee_id_idx" ON "employee_documents"("employee_id");

-- CreateIndex
CREATE INDEX "employee_documents_expiry_date_idx" ON "employee_documents"("expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structures_employee_id_key" ON "salary_structures"("employee_id");

-- CreateIndex
CREATE INDEX "salary_structures_employee_id_idx" ON "salary_structures"("employee_id");

-- CreateIndex
CREATE INDEX "salary_structures_effective_from_effective_to_idx" ON "salary_structures"("effective_from", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "allowance_types_name_key" ON "allowance_types"("name");

-- CreateIndex
CREATE INDEX "employee_allowances_employee_id_is_active_idx" ON "employee_allowances"("employee_id", "is_active");

-- CreateIndex
CREATE INDEX "employee_allowances_effective_from_effective_to_idx" ON "employee_allowances"("effective_from", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "employee_allowances_employee_id_allowance_type_id_is_active_key" ON "employee_allowances"("employee_id", "allowance_type_id", "is_active");

-- CreateIndex
CREATE INDEX "employee_loans_employee_id_status_idx" ON "employee_loans"("employee_id", "status");

-- CreateIndex
CREATE INDEX "employee_loans_status_idx" ON "employee_loans"("status");

-- CreateIndex
CREATE INDEX "employee_loans_end_date_idx" ON "employee_loans"("end_date");

-- CreateIndex
CREATE INDEX "employee_deductions_employee_id_idx" ON "employee_deductions"("employee_id");

-- CreateIndex
CREATE INDEX "employee_deductions_deduction_date_idx" ON "employee_deductions"("deduction_date");

-- CreateIndex
CREATE INDEX "employee_deductions_deduction_type_idx" ON "employee_deductions"("deduction_type");

-- CreateIndex
CREATE UNIQUE INDEX "projects_tender_number_key" ON "projects"("tender_number");

-- CreateIndex
CREATE INDEX "projects_status_deleted_at_idx" ON "projects"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "projects_manager_id_idx" ON "projects"("manager_id");

-- CreateIndex
CREATE INDEX "projects_completion_percentage_idx" ON "projects"("completion_percentage");

-- CreateIndex
CREATE INDEX "projects_actual_start_date_actual_end_date_idx" ON "projects"("actual_start_date", "actual_end_date");

-- CreateIndex
CREATE INDEX "project_employees_project_id_is_active_idx" ON "project_employees"("project_id", "is_active");

-- CreateIndex
CREATE INDEX "project_employees_employee_id_is_active_idx" ON "project_employees"("employee_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "project_employees_project_id_employee_id_assigned_date_key" ON "project_employees"("project_id", "employee_id", "assigned_date");

-- CreateIndex
CREATE INDEX "project_assets_project_id_is_active_idx" ON "project_assets"("project_id", "is_active");

-- CreateIndex
CREATE INDEX "project_assets_asset_id_is_active_idx" ON "project_assets"("asset_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "project_assets_project_id_asset_id_assigned_date_key" ON "project_assets"("project_id", "asset_id", "assigned_date");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_number_key" ON "assets"("asset_number");

-- CreateIndex
CREATE UNIQUE INDEX "assets_serial_number_key" ON "assets"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "assets_license_plate_key" ON "assets"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "assets_chassis_number_key" ON "assets"("chassis_number");

-- CreateIndex
CREATE INDEX "assets_asset_number_status_idx" ON "assets"("asset_number", "status");

-- CreateIndex
CREATE INDEX "assets_asset_type_status_idx" ON "assets"("asset_type", "status");

-- CreateIndex
CREATE INDEX "assets_status_deleted_at_idx" ON "assets"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "assets_license_plate_idx" ON "assets"("license_plate");

-- CreateIndex
CREATE INDEX "asset_documents_asset_id_idx" ON "asset_documents"("asset_id");

-- CreateIndex
CREATE INDEX "asset_documents_expiry_date_idx" ON "asset_documents"("expiry_date");

-- CreateIndex
CREATE INDEX "asset_employees_asset_id_is_active_idx" ON "asset_employees"("asset_id", "is_active");

-- CreateIndex
CREATE INDEX "asset_employees_employee_id_is_active_idx" ON "asset_employees"("employee_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "asset_employees_asset_id_assignment_type_is_primary_is_acti_key" ON "asset_employees"("asset_id", "assignment_type", "is_primary", "is_active");

-- CreateIndex
CREATE INDEX "asset_operations_asset_id_start_time_idx" ON "asset_operations"("asset_id", "start_time" DESC);

-- CreateIndex
CREATE INDEX "asset_operations_project_id_start_time_idx" ON "asset_operations"("project_id", "start_time" DESC);

-- CreateIndex
CREATE INDEX "asset_operations_operator_id_idx" ON "asset_operations"("operator_id");

-- CreateIndex
CREATE INDEX "asset_operations_start_time_end_time_idx" ON "asset_operations"("start_time", "end_time");

-- CreateIndex
CREATE INDEX "maintenance_requests_asset_id_status_idx" ON "maintenance_requests"("asset_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_requests_status_priority_idx" ON "maintenance_requests"("status", "priority");

-- CreateIndex
CREATE INDEX "maintenance_requests_scheduled_date_idx" ON "maintenance_requests"("scheduled_date");

-- CreateIndex
CREATE INDEX "maintenance_attachments_maintenance_id_idx" ON "maintenance_attachments"("maintenance_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_categories_name_key" ON "cost_categories"("name");

-- CreateIndex
CREATE INDEX "cost_categories_parent_id_idx" ON "cost_categories"("parent_id");

-- CreateIndex
CREATE INDEX "project_costs_project_id_transaction_date_idx" ON "project_costs"("project_id", "transaction_date" DESC);

-- CreateIndex
CREATE INDEX "project_costs_cost_type_project_id_idx" ON "project_costs"("cost_type", "project_id");

-- CreateIndex
CREATE INDEX "project_costs_reference_type_reference_id_idx" ON "project_costs"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "project_costs_payment_status_idx" ON "project_costs"("payment_status");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_created_at_idx" ON "audit_logs"("resource_type", "resource_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_status_idx" ON "audit_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "files_key_key" ON "files"("key");

-- CreateIndex
CREATE INDEX "files_uploaded_by_idx" ON "files"("uploaded_by");

-- CreateIndex
CREATE INDEX "files_uploaded_at_idx" ON "files"("uploaded_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_custom_permissions" ADD CONSTRAINT "user_custom_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_custom_permissions" ADD CONSTRAINT "user_custom_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_custom_permissions" ADD CONSTRAINT "user_custom_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_grant_history" ADD CONSTRAINT "permission_grant_history_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_allowances" ADD CONSTRAINT "employee_allowances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_allowances" ADD CONSTRAINT "employee_allowances_allowance_type_id_fkey" FOREIGN KEY ("allowance_type_id") REFERENCES "allowance_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_loans" ADD CONSTRAINT "employee_loans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_employees" ADD CONSTRAINT "project_employees_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_employees" ADD CONSTRAINT "project_employees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_employees" ADD CONSTRAINT "asset_employees_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_employees" ADD CONSTRAINT "asset_employees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_operations" ADD CONSTRAINT "asset_operations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_operations" ADD CONSTRAINT "asset_operations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_operations" ADD CONSTRAINT "asset_operations_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_attachments" ADD CONSTRAINT "maintenance_attachments_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_categories" ADD CONSTRAINT "cost_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "cost_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_costs" ADD CONSTRAINT "project_costs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_costs" ADD CONSTRAINT "project_costs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cost_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_costs" ADD CONSTRAINT "project_costs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_costs" ADD CONSTRAINT "project_costs_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
