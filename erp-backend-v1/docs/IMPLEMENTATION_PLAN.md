# 🚀 ERP System - Senior Implementation Plan

## 📌 **Philosophy & Principles**

### **Core Principles**

1. ✅ **Clean Architecture** - Business logic independent of frameworks
2. ✅ **SOLID Principles** - Maintainable and testable code
3. ✅ **DDD (Domain-Driven Design)** - Rich domain models
4. ✅ **CQRS (Command Query Responsibility Segregation)** - For reporting
5. ✅ **Event-Driven** - Loose coupling between modules
6. ✅ **Database-First Optimization** - Performance from day 1
7. ✅ **Security-First** - Defense in depth

---

## 🎯 **Realistic Timeline: 18 Weeks**

### **Phase 1: Foundation (Weeks 1-3)**

- ✅ Project structure & architecture
- ✅ Database schema with optimizations
- ✅ Authentication & JWT
- ✅ RBAC with caching
- ✅ Audit logging infrastructure
- ✅ Error handling & logging
- ✅ API documentation (Swagger)

### **Phase 2: Core Modules (Weeks 4-8)**

- ✅ Users management
- ✅ Employees (CRUD + contracts)
- ✅ Projects (CRUD + assignments)
- ✅ Assets (CRUD + assignments)
- ✅ Many-to-many relationships

### **Phase 3: Operations (Weeks 9-12)**

- ✅ Payroll (salary + allowances)
- ✅ Loans & deductions
- ✅ Asset operations tracking
- ✅ Maintenance module
- ✅ Cost tracking

### **Phase 4: Reporting & Optimization (Weeks 13-16)**

- ✅ Materialized views
- ✅ Report generation
- ✅ Excel/PDF export
- ✅ Performance tuning
- ✅ Caching layer

### **Phase 5: Testing & Deployment (Weeks 17-18)**

- ✅ Integration tests
- ✅ Load testing
- ✅ Security audit
- ✅ Production deployment
- ✅ Monitoring setup

---

## 🏗️ **Architecture Layers**

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│  (Controllers, DTOs, Validation, Swagger Documentation)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│        (Use Cases, Application Services, Events)            │
│  - CreateEmployeeUseCase                                    │
│  - AssignEmployeeToProjectUseCase                          │
│  - GeneratePayrollUseCase                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                           │
│  (Entities, Value Objects, Domain Events, Business Rules)   │
│  - Employee (Aggregate Root)                                │
│  - Project (Aggregate Root)                                 │
│  - Asset (Aggregate Root)                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                       │
│  (Database, Cache, Queue, Storage, External Services)       │
│  - PrismaEmployeeRepository implements IEmployeeRepository  │
│  - RedisCache implements ICacheService                      │
│  - BullQueue implements IQueueService                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ **Database Optimization Strategy**

### **1. Indexing Strategy**

```sql
-- ============================================================================
-- CRITICAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users: Fast login & permission checks
CREATE INDEX idx_users_email_active ON users(email, is_active)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);

-- Employees: Common searches
CREATE INDEX idx_employees_status_department ON employees(status, department)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_search ON employees USING GIN(
  to_tsvector('english',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(employee_number, '')
  )
);

-- Projects: Dashboard queries
CREATE INDEX idx_projects_status_completion ON projects(status, completion_percentage)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_dates ON projects(actual_start_date, actual_end_date)
  WHERE status = 'ACTIVE';

-- Assets: Utilization tracking
CREATE INDEX idx_assets_type_status ON assets(asset_type, status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_operations_asset_time ON asset_operations(asset_id, start_time DESC);
CREATE INDEX idx_asset_operations_project_time ON asset_operations(project_id, start_time DESC)
  WHERE project_id IS NOT NULL;

-- Project Costs: Financial reporting
CREATE INDEX idx_project_costs_project_date ON project_costs(project_id, transaction_date DESC);
CREATE INDEX idx_project_costs_type ON project_costs(cost_type, payment_status);
CREATE INDEX idx_project_costs_reference ON project_costs(reference_type, reference_id)
  WHERE reference_type IS NOT NULL;

-- Audit Logs: Fast lookups
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_logs_failed ON audit_logs(status, action, created_at DESC)
  WHERE status IN ('FAILED', 'UNAUTHORIZED');

-- RBAC: Permission resolution
CREATE INDEX idx_user_roles_user_active ON user_roles(user_id, is_active, expires_at);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
```

### **2. Materialized Views for Reporting**

```sql
-- ============================================================================
-- MATERIALIZED VIEWS - Refresh every hour or on-demand
-- ============================================================================

-- Asset Utilization Summary
CREATE MATERIALIZED VIEW mv_asset_utilization AS
SELECT
  a.id AS asset_id,
  a.asset_number,
  a.name,
  a.asset_type,
  a.status,
  DATE(ao.start_time) AS operation_date,
  COUNT(ao.id) AS operation_count,
  SUM(EXTRACT(EPOCH FROM (ao.end_time - ao.start_time))/3600) AS total_hours,
  SUM(ao.fuel_consumed) AS total_fuel,
  SUM(ao.fuel_cost) AS total_fuel_cost,
  COUNT(DISTINCT ao.project_id) AS projects_count,
  MAX(ao.end_time) AS last_operation
FROM assets a
LEFT JOIN asset_operations ao ON a.id = ao.asset_id
WHERE a.deleted_at IS NULL
  AND ao.start_time >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY a.id, a.asset_number, a.name, a.asset_type, a.status, DATE(ao.start_time);

CREATE UNIQUE INDEX idx_mv_asset_util_pk ON mv_asset_utilization(asset_id, operation_date);
CREATE INDEX idx_mv_asset_util_date ON mv_asset_utilization(operation_date DESC);

-- Project Financial Summary
CREATE MATERIALIZED VIEW mv_project_financials AS
SELECT
  p.id AS project_id,
  p.name,
  p.tender_number,
  p.status,
  p.budget,
  COUNT(pc.id) AS cost_count,
  SUM(pc.amount) AS total_costs,
  SUM(CASE WHEN pc.payment_status = 'PAID' THEN pc.amount ELSE 0 END) AS paid_costs,
  SUM(CASE WHEN pc.payment_status = 'PENDING' THEN pc.amount ELSE 0 END) AS pending_costs,
  (p.budget - SUM(pc.amount)) AS remaining_budget,
  ((p.budget - SUM(pc.amount)) / p.budget * 100) AS budget_utilization_pct,
  MAX(pc.transaction_date) AS last_cost_date
FROM projects p
LEFT JOIN project_costs pc ON p.id = pc.project_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.tender_number, p.status, p.budget;

CREATE UNIQUE INDEX idx_mv_project_fin_pk ON mv_project_financials(project_id);

-- Employee Summary (for payroll)
CREATE MATERIALIZED VIEW mv_employee_payroll_summary AS
SELECT
  e.id AS employee_id,
  e.employee_number,
  e.first_name,
  e.last_name,
  e.status,
  e.employment_type,
  ss.base_salary,
  COALESCE(SUM(ea.amount), 0) AS total_allowances,
  COALESCE(SUM(ed.amount), 0) AS total_deductions,
  COUNT(el.id) AS active_loans,
  COALESCE(SUM(el.remaining_amount), 0) AS total_loan_balance,
  (ss.base_salary + COALESCE(SUM(ea.amount), 0) - COALESCE(SUM(ed.amount), 0)) AS net_salary
FROM employees e
LEFT JOIN salary_structures ss ON e.id = ss.employee_id
LEFT JOIN employee_allowances ea ON e.id = ea.employee_id AND ea.is_active = true
LEFT JOIN employee_deductions ed ON e.id = ed.employee_id AND ed.deduction_date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN employee_loans el ON e.id = el.employee_id AND el.status = 'ACTIVE'
WHERE e.deleted_at IS NULL AND e.status = 'ACTIVE'
GROUP BY e.id, e.employee_number, e.first_name, e.last_name, e.status, e.employment_type, ss.base_salary;

CREATE UNIQUE INDEX idx_mv_emp_payroll_pk ON mv_employee_payroll_summary(employee_id);
```

### **3. Database Triggers for Data Integrity**

```sql
-- ============================================================================
-- TRIGGERS - Automatic calculations and validations
-- ============================================================================

-- Auto-update project total costs
CREATE OR REPLACE FUNCTION update_project_total_costs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET
    total_costs = (
      SELECT COALESCE(SUM(amount), 0)
      FROM project_costs
      WHERE project_id = NEW.project_id
    ),
    costs_last_updated = NOW()
  WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_project_costs
AFTER INSERT OR UPDATE OR DELETE ON project_costs
FOR EACH ROW EXECUTE FUNCTION update_project_total_costs();

-- Auto-calculate asset operation duration
CREATE OR REPLACE FUNCTION calculate_operation_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    -- Update asset's current odometer
    UPDATE assets
    SET current_odometer = NEW.end_odometer
    WHERE id = NEW.asset_id AND NEW.end_odometer IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_operation_duration
BEFORE UPDATE ON asset_operations
FOR EACH ROW EXECUTE FUNCTION calculate_operation_duration();

-- Prevent deletion of system roles
CREATE OR REPLACE FUNCTION prevent_system_role_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_system_role = true THEN
    RAISE EXCEPTION 'Cannot delete system role: %', OLD.name;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_system_role_del
BEFORE DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION prevent_system_role_deletion();
```

### **4. Partitioning Strategy (for scalability)**

```sql
-- ============================================================================
-- TABLE PARTITIONING - For high-volume tables
-- ============================================================================

-- Partition audit_logs by month (12+ months of data)
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Auto-create partitions with pg_partman extension
-- Or use a cron job to create future partitions

-- Partition asset_operations by quarter (for historical data)
CREATE TABLE asset_operations_partitioned (
  LIKE asset_operations INCLUDING ALL
) PARTITION BY RANGE (start_time);
```

---

## 🔧 **Code Architecture & Patterns**

### **1. Repository Pattern (Abstraction Layer)**

```typescript
// ============================================================================
// REPOSITORY INTERFACE - Domain layer (framework-agnostic)
// ============================================================================

// src/core/interfaces/repositories/employee.repository.interface.ts
export interface IEmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findByEmployeeNumber(employeeNumber: string): Promise<Employee | null>;
  findActive(filters?: EmployeeFilters): Promise<PaginatedResult<Employee>>;
  create(employee: CreateEmployeeDto): Promise<Employee>;
  update(id: string, data: UpdateEmployeeDto): Promise<Employee>;
  softDelete(id: string, deletedBy: string): Promise<void>;
  restore(id: string): Promise<Employee>;
  search(query: string, options?: SearchOptions): Promise<Employee[]>;
}

// ============================================================================
// REPOSITORY IMPLEMENTATION - Infrastructure layer
// ============================================================================

// src/infrastructure/database/repositories/prisma-employee.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IEmployeeRepository } from '@/core/interfaces/repositories';
import { Employee } from '@/core/domain/entities/employee.entity';
import { EmployeeMapper } from '@/application/modules/employees/mappers/employee.mapper';

@Injectable()
export class PrismaEmployeeRepository implements IEmployeeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: EmployeeMapper,
  ) {}

  /**
   * Find employee by ID with caching
   * Performance: Cached for 5 minutes
   */
  async findById(id: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id,
        deletedAt: null, // Always filter soft-deleted
      },
      include: {
        salaryStructure: true,
        contracts: {
          where: { isActive: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    return employee ? this.mapper.toDomain(employee) : null;
  }

  /**
   * Find active employees with filtering and pagination
   * Performance: Optimized with covering indexes
   */
  async findActive(
    filters?: EmployeeFilters,
  ): Promise<PaginatedResult<Employee>> {
    const {
      page = 1,
      limit = 20,
      status,
      department,
      employmentType,
    } = filters || {};

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(department && { department }),
      ...(employmentType && { employmentType }),
    };

    // Parallel queries for better performance
    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          department: true,
          position: true,
          employmentType: true,
          hireDate: true,
          // Don't select heavy fields for list view
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: data.map((e) => this.mapper.toDomain(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Full-text search with PostgreSQL
   * Performance: Uses GIN index on tsvector
   */
  async search(query: string, options?: SearchOptions): Promise<Employee[]> {
    const employees = await this.prisma.$queryRaw<any[]>`
      SELECT
        id, employee_number, first_name, last_name, email, phone, status
      FROM employees
      WHERE deleted_at IS NULL
        AND to_tsvector('english',
          COALESCE(first_name, '') || ' ' ||
          COALESCE(last_name, '') || ' ' ||
          COALESCE(employee_number, '')
        ) @@ plainto_tsquery('english', ${query})
      ORDER BY ts_rank(
        to_tsvector('english', first_name || ' ' || last_name),
        plainto_tsquery('english', ${query})
      ) DESC
      LIMIT ${options?.limit || 20}
    `;

    return employees.map((e) => this.mapper.toDomain(e));
  }

  /**
   * Soft delete with audit trail
   */
  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }
}
```

### **2. Use Case Pattern (Business Logic)**

```typescript
// ============================================================================
// USE CASE - Application layer
// Single Responsibility: One use case = One business operation
// ============================================================================

// src/core/use-cases/employees/create-employee.use-case.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { IEmployeeRepository } from '@/core/interfaces/repositories';
import { IEventPublisher } from '@/core/interfaces/events';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Employee } from '@/core/domain/entities/employee.entity';
import { EmployeeCreatedEvent } from '@/core/domain/events/employee-created.event';

/**
 * Create Employee Use Case
 *
 * Business Rules:
 * 1. National ID must be unique
 * 2. Employee number must be unique and auto-generated
 * 3. Email must be unique if provided
 * 4. Hire date cannot be in the future
 * 5. Must assign to a valid department
 *
 * @throws ConflictException if national ID or email already exists
 * @throws BadRequestException if validation fails
 */
@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    private readonly employeeRepo: IEmployeeRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: CreateEmployeeDto, createdBy: string): Promise<Employee> {
    // Step 1: Validate business rules
    await this.validateUniqueConstraints(dto);

    // Step 2: Generate employee number
    const employeeNumber = await this.generateEmployeeNumber();

    // Step 3: Create domain entity (with business logic)
    const employee = Employee.create({
      ...dto,
      employeeNumber,
      createdBy,
    });

    // Step 4: Persist to database
    const savedEmployee = await this.employeeRepo.create(employee);

    // Step 5: Publish domain event (for audit, notifications, etc.)
    await this.eventPublisher.publish(
      new EmployeeCreatedEvent({
        employeeId: savedEmployee.id,
        employeeNumber: savedEmployee.employeeNumber,
        createdBy,
        timestamp: new Date(),
      }),
    );

    return savedEmployee;
  }

  /**
   * Validate unique constraints
   * Performance: Parallel checks for faster validation
   */
  private async validateUniqueConstraints(
    dto: CreateEmployeeDto,
  ): Promise<void> {
    const [existingNationalId, existingEmail] = await Promise.all([
      this.employeeRepo.findByNationalId(dto.nationalId),
      dto.email ? this.employeeRepo.findByEmail(dto.email) : null,
    ]);

    if (existingNationalId) {
      throw new ConflictException(
        `Employee with national ID ${dto.nationalId} already exists`,
      );
    }

    if (existingEmail) {
      throw new ConflictException(
        `Employee with email ${dto.email} already exists`,
      );
    }
  }

  /**
   * Generate sequential employee number
   * Format: EMP-YYYY-XXXX (e.g., EMP-2024-0001)
   */
  private async generateEmployeeNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastEmployee = await this.employeeRepo.findLastByYear(year);

    const sequence = lastEmployee
      ? parseInt(lastEmployee.employeeNumber.split('-')[2]) + 1
      : 1;

    return `EMP-${year}-${sequence.toString().padStart(4, '0')}`;
  }
}
```

Continue in next message...
