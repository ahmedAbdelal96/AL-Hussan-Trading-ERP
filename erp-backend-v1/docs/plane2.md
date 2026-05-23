# Payroll Module Implementation Plan

## Overview
Create a complete Payroll Module following MODULE_CREATION_PROMPT.md methodology to manage:
- Salary structures for employees
- Flexible allowance types and employee allowances
- Employee loans with installment tracking
- Employee deductions (various types including loan repayments)
- Approval workflows for loans and allowances

## Database Schema Summary (from Prisma)

### Tables (5):
1. **SalaryStructure** - Employee salary information with effective dates
2. **AllowanceType** - Catalog of allowance types (flexible, managed by company)
3. **EmployeeAllowance** - Employee-specific allowances with amounts and frequencies
4. **EmployeeLoan** - Loan tracking with installment management
5. **EmployeeDeduction** - Deduction records (taxes, penalties, loan repayments, etc.)

### Enums (3):
- **LoanStatus**: PENDING, APPROVED, ACTIVE, PAID_OFF, REJECTED, DEFAULTED
- **DeductionType**: LOAN_REPAYMENT, INSURANCE, TAX, PENALTY, ADVANCE_DEDUCTION, ABSENCE, OTHER
- **AllowanceFrequency**: ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUALLY

## Architecture Patterns (from Finance & Assets modules)

### 1. Entity Pattern
- Business logic helper methods
- Constructor with partial pattern
- Status checking methods
- Validation methods

### 2. Repository Pattern
- Interface with Symbol-based DI token
- Implementation with Prisma client
- CRUD operations + custom queries
- Error handling with NotFoundException
- Decimal precision for financial fields
- Soft delete support

### 3. Use Case Pattern
- Single responsibility per use case
- Constructor-based DI
- Logger integration
- Business rule enforcement
- Transaction support for critical operations

### 4. Controller Pattern
- Permission-based auth decorators
- Swagger documentation decorators
- CurrentUser decorator for audit trails
- Proper HTTP method usage
- Structured endpoints

### 5. DTO Pattern
- Create, Update, Response, Filters per entity
- Class-validator decorators
- ApiProperty decorators
- Optional fields handling

## Implementation Steps

### Phase 1: Core Infrastructure (Entities & DTOs)

#### Step 1.1: Create Entities (5 files)
Location: `src/application/modules/payroll/entities/`

**1. salary-structure.entity.ts**
```typescript
export class SalaryStructureEntity {
  id: string;
  employeeId: string;
  baseSalary: number; // Convert from Decimal
  currency: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // Helper methods:
  isActive(): boolean - Check if currently active
  isEffectiveOn(date: Date): boolean - Check if effective on specific date
}
```

**2. allowance-type.entity.ts**
```typescript
export class AllowanceTypeEntity {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Helper methods:
  isUsable(): boolean - Check if can be assigned to employees
}
```

**3. employee-allowance.entity.ts**
```typescript
export class EmployeeAllowanceEntity {
  id: string;
  employeeId: string;
  allowanceTypeId: string;
  amount: number; // Convert from Decimal
  frequency: AllowanceFrequency;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  allowanceType?: AllowanceTypeEntity;

  // Helper methods:
  isApproved(): boolean
  isRejected(): boolean
  isPending(): boolean
  isCurrentlyActive(): boolean
  calculateMonthlyEquivalent(): number - Convert to monthly amount
}
```

**4. employee-loan.entity.ts**
```typescript
export class EmployeeLoanEntity {
  id: string;
  employeeId: string;
  amount: number; // Convert from Decimal
  remainingAmount: number; // Convert from Decimal
  installments: number;
  paidInstallments: number;
  installmentAmount: number; // Convert from Decimal
  startDate: Date;
  endDate?: Date;
  status: LoanStatus;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Helper methods:
  isPending(): boolean
  isApproved(): boolean
  isActive(): boolean
  isPaidOff(): boolean
  isRejected(): boolean
  isDefaulted(): boolean
  getProgress(): number - Percentage paid
  canPayInstallment(): boolean
  getRemainingInstallments(): number
}
```

**5. employee-deduction.entity.ts**
```typescript
export class EmployeeDeductionEntity {
  id: string;
  employeeId: string;
  deductionType: DeductionType;
  amount: number; // Convert from Decimal
  deductionDate: Date;
  loanId?: string;
  description?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;

  // Relations
  loan?: EmployeeLoanEntity;

  // Helper methods:
  isLoanRepayment(): boolean
  requiresApproval(): boolean
}
```

#### Step 1.2: Create DTOs (30+ files organized by entity)
Location: `src/application/modules/payroll/dto/`

**Salary Structure DTOs:**
1. create-salary-structure.dto.ts
2. update-salary-structure.dto.ts
3. salary-structure-response.dto.ts
4. salary-structure-filters.dto.ts

**Allowance Type DTOs:**
5. create-allowance-type.dto.ts
6. update-allowance-type.dto.ts
7. allowance-type-response.dto.ts
8. allowance-type-filters.dto.ts

**Employee Allowance DTOs:**
9. create-employee-allowance.dto.ts
10. update-employee-allowance.dto.ts
11. employee-allowance-response.dto.ts
12. employee-allowance-filters.dto.ts
13. approve-employee-allowance.dto.ts
14. reject-employee-allowance.dto.ts

**Employee Loan DTOs:**
15. create-employee-loan.dto.ts
16. update-employee-loan.dto.ts
17. employee-loan-response.dto.ts
18. employee-loan-filters.dto.ts
19. approve-employee-loan.dto.ts
20. reject-employee-loan.dto.ts
21. pay-loan-installment.dto.ts

**Employee Deduction DTOs:**
22. create-employee-deduction.dto.ts
23. update-employee-deduction.dto.ts
24. employee-deduction-response.dto.ts
25. employee-deduction-filters.dto.ts

**Summary DTOs:**
26. employee-payroll-summary.dto.ts (total salary + allowances - deductions)

**index.ts** - Export all DTOs

### Phase 2: Data Access Layer (Repositories)

#### Step 2.1: Create Repository Interfaces & Tokens
Location: `src/application/modules/payroll/repositories/index.ts`

```typescript
export const SALARY_STRUCTURE_REPOSITORY = Symbol('SALARY_STRUCTURE_REPOSITORY');
export const ALLOWANCE_TYPE_REPOSITORY = Symbol('ALLOWANCE_TYPE_REPOSITORY');
export const EMPLOYEE_ALLOWANCE_REPOSITORY = Symbol('EMPLOYEE_ALLOWANCE_REPOSITORY');
export const EMPLOYEE_LOAN_REPOSITORY = Symbol('EMPLOYEE_LOAN_REPOSITORY');
export const EMPLOYEE_DEDUCTION_REPOSITORY = Symbol('EMPLOYEE_DEDUCTION_REPOSITORY');

export interface ISalaryStructureRepository {
  create(...): Promise<SalaryStructureEntity>;
  findById(...): Promise<SalaryStructureEntity | null>;
  findAll(...): Promise<{ data: SalaryStructureEntity[]; total: number }>;
  update(...): Promise<SalaryStructureEntity>;
  delete(...): Promise<void>;
  findActiveByEmployeeId(employeeId: string): Promise<SalaryStructureEntity | null>;
  findByEmployeeIdWithHistory(employeeId: string): Promise<SalaryStructureEntity[]>;
}

// Similar interfaces for other repositories...
```

#### Step 2.2: Create Repository Implementations (5 files)

**1. salary-structure.repository.ts**
- CRUD operations
- `findActiveByEmployeeId()` - Get current active salary
- `findByEmployeeIdWithHistory()` - Get salary history
- Decimal conversion for baseSalary

**2. allowance-type.repository.ts**
- CRUD operations
- `findAllActive()` - Get all active allowance types
- `findByName()` - Check duplicates

**3. employee-allowance.repository.ts**
- CRUD operations
- `findActiveByEmployeeId()` - Get employee's active allowances
- `findPendingApprovals()` - Get allowances awaiting approval
- `approve()` - Approve allowance
- `reject()` - Reject allowance
- Decimal conversion for amount

**4. employee-loan.repository.ts**
- CRUD operations
- `findActiveByEmployeeId()` - Get employee's active loans
- `findPendingApprovals()` - Get loans awaiting approval
- `approve()` - Approve loan and set status to ACTIVE
- `reject()` - Reject loan
- `payInstallment()` - Record installment payment
- `findByStatus()` - Filter by loan status
- Decimal conversion for amount, remainingAmount, installmentAmount

**5. employee-deduction.repository.ts**
- CRUD operations
- `findByEmployeeId()` - Get employee deductions
- `findByLoanId()` - Get deductions for specific loan
- `findByDateRange()` - Get deductions in period
- `getTotalByType()` - Sum deductions by type
- Decimal conversion for amount

### Phase 3: Business Logic Layer (Use Cases)

#### Step 3.1: Create Use Cases (35+ files)

**Salary Structure Use Cases (5):**
1. create-salary-structure.use-case.ts
   - Validate employee exists
   - Check for overlapping effective dates
   - Create with Decimal conversion

2. get-salary-structure.use-case.ts
3. get-all-salary-structures.use-case.ts
4. update-salary-structure.use-case.ts
   - Validate date ranges

5. delete-salary-structure.use-case.ts

**Allowance Type Use Cases (5):**
6. create-allowance-type.use-case.ts
   - Check name uniqueness

7. get-allowance-type.use-case.ts
8. get-all-allowance-types.use-case.ts
9. update-allowance-type.use-case.ts
10. delete-allowance-type.use-case.ts
    - Check if in use before deletion

**Employee Allowance Use Cases (8):**
11. create-employee-allowance.use-case.ts
    - Validate employee and allowance type
    - Set initial status as pending or approved based on permissions

12. get-employee-allowance.use-case.ts
13. get-all-employee-allowances.use-case.ts
14. update-employee-allowance.use-case.ts
15. delete-employee-allowance.use-case.ts
16. approve-employee-allowance.use-case.ts
    - Update status and set approvedBy/approvedAt

17. reject-employee-allowance.use-case.ts
    - Update status and set rejectedBy/rejectedAt/rejectionReason

18. get-employee-active-allowances.use-case.ts

**Employee Loan Use Cases (9):**
19. create-employee-loan.use-case.ts
    - Validate employee
    - Calculate installmentAmount
    - Set status to PENDING initially

20. get-employee-loan.use-case.ts
21. get-all-employee-loans.use-case.ts
22. update-employee-loan.use-case.ts
23. delete-employee-loan.use-case.ts
24. approve-employee-loan.use-case.ts
    - Change status from PENDING to ACTIVE
    - Set startDate

25. reject-employee-loan.use-case.ts
26. pay-loan-installment.use-case.ts (CRITICAL)
    - Create EmployeeDeduction with type LOAN_REPAYMENT
    - Update paidInstallments and remainingAmount
    - Change status to PAID_OFF when complete
    - Use transaction

27. get-employee-active-loans.use-case.ts

**Employee Deduction Use Cases (6):**
28. create-employee-deduction.use-case.ts
    - Validate employee
    - If type is LOAN_REPAYMENT, validate loanId

29. get-employee-deduction.use-case.ts
30. get-all-employee-deductions.use-case.ts
31. update-employee-deduction.use-case.ts
32. delete-employee-deduction.use-case.ts
33. get-employee-deductions-summary.use-case.ts

**Payroll Summary Use Cases (2):**
34. get-employee-payroll-summary.use-case.ts
    - Calculate: baseSalary + total allowances - total deductions
    - Return breakdown by allowance type and deduction type

35. get-all-employees-payroll-summary.use-case.ts
    - Summary for all employees or filtered list

### Phase 4: API Layer (Controller & Swagger)

#### Step 4.1: Create Swagger Decorators
Location: `src/application/modules/payroll/decorators/payroll-swagger.decorators.ts`

Create decorator factories for all 35+ endpoints following Finance module pattern.

#### Step 4.2: Create Controller
Location: `src/application/modules/payroll/controllers/payroll.controller.ts`

**Endpoints Structure:**

```typescript
@Controller('payroll')
@ApiTags('Payroll')
export class PayrollController {
  // SALARY STRUCTURE ENDPOINTS (5)
  POST   /payroll/salary-structures          - Create
  GET    /payroll/salary-structures          - Get all with filters
  GET    /payroll/salary-structures/:id      - Get one
  PUT    /payroll/salary-structures/:id      - Update
  DELETE /payroll/salary-structures/:id      - Delete

  // ALLOWANCE TYPE ENDPOINTS (5)
  POST   /payroll/allowance-types            - Create
  GET    /payroll/allowance-types            - Get all
  GET    /payroll/allowance-types/:id        - Get one
  PUT    /payroll/allowance-types/:id        - Update
  DELETE /payroll/allowance-types/:id        - Delete

  // EMPLOYEE ALLOWANCE ENDPOINTS (8)
  POST   /payroll/allowances                 - Create
  GET    /payroll/allowances                 - Get all with filters
  GET    /payroll/allowances/:id             - Get one
  PUT    /payroll/allowances/:id             - Update
  DELETE /payroll/allowances/:id             - Delete
  POST   /payroll/allowances/:id/approve     - Approve
  POST   /payroll/allowances/:id/reject      - Reject
  GET    /payroll/employees/:employeeId/allowances - Get employee's allowances

  // EMPLOYEE LOAN ENDPOINTS (9)
  POST   /payroll/loans                      - Create
  GET    /payroll/loans                      - Get all with filters
  GET    /payroll/loans/:id                  - Get one
  PUT    /payroll/loans/:id                  - Update
  DELETE /payroll/loans/:id                  - Delete
  POST   /payroll/loans/:id/approve          - Approve
  POST   /payroll/loans/:id/reject           - Reject
  POST   /payroll/loans/:id/pay-installment  - Pay installment
  GET    /payroll/employees/:employeeId/loans - Get employee's loans

  // EMPLOYEE DEDUCTION ENDPOINTS (6)
  POST   /payroll/deductions                 - Create
  GET    /payroll/deductions                 - Get all with filters
  GET    /payroll/deductions/:id             - Get one
  PUT    /payroll/deductions/:id             - Update
  DELETE /payroll/deductions/:id             - Delete
  GET    /payroll/employees/:employeeId/deductions - Get employee's deductions

  // PAYROLL SUMMARY ENDPOINTS (2)
  GET    /payroll/employees/:employeeId/summary - Get employee payroll summary
  GET    /payroll/summary                    - Get all employees summary
}
```

**Permissions:**
- `payroll:salary:create`
- `payroll:salary:read`
- `payroll:salary:update`
- `payroll:salary:delete`
- `payroll:allowance-types:create`
- `payroll:allowance-types:read`
- `payroll:allowance-types:update`
- `payroll:allowance-types:delete`
- `payroll:allowances:create`
- `payroll:allowances:read`
- `payroll:allowances:update`
- `payroll:allowances:delete`
- `payroll:allowances:approve`
- `payroll:loans:create`
- `payroll:loans:read`
- `payroll:loans:update`
- `payroll:loans:delete`
- `payroll:loans:approve`
- `payroll:deductions:create`
- `payroll:deductions:read`
- `payroll:deductions:update`
- `payroll:deductions:delete`

### Phase 5: Module Configuration

#### Step 5.1: Create Payroll Module
Location: `src/application/modules/payroll/payroll.module.ts`

```typescript
@Module({
  imports: [DatabaseModule, LoggerModule, AuthModule, RbacModule],
  controllers: [PayrollController],
  providers: [
    // Repositories
    { provide: SALARY_STRUCTURE_REPOSITORY, useClass: SalaryStructureRepository },
    { provide: ALLOWANCE_TYPE_REPOSITORY, useClass: AllowanceTypeRepository },
    { provide: EMPLOYEE_ALLOWANCE_REPOSITORY, useClass: EmployeeAllowanceRepository },
    { provide: EMPLOYEE_LOAN_REPOSITORY, useClass: EmployeeLoanRepository },
    { provide: EMPLOYEE_DEDUCTION_REPOSITORY, useClass: EmployeeDeductionRepository },

    // All 35+ Use Cases
    ...
  ],
  exports: [
    SALARY_STRUCTURE_REPOSITORY,
    ALLOWANCE_TYPE_REPOSITORY,
    EMPLOYEE_ALLOWANCE_REPOSITORY,
    EMPLOYEE_LOAN_REPOSITORY,
    EMPLOYEE_DEDUCTION_REPOSITORY,
  ],
})
export class PayrollModule {}
```

#### Step 5.2: Register in App Module
Location: `src/app.module.ts`

Add `PayrollModule` to imports array after FinanceModule.

### Phase 6: Documentation

#### Step 6.1: Create API Documentation
Location: `src/application/modules/payroll/PAYROLL_API.md`

Document all 35+ endpoints with:
- Request/Response examples
- Permission requirements
- Business rules
- Common use cases

## Critical Implementation Details

### 1. Decimal Precision (Following Finance Module Pattern)
```typescript
// In Repository - Store as Decimal
const salary = await this.prisma.salaryStructure.create({
  data: {
    baseSalary: new Prisma.Decimal(dto.baseSalary), // CRITICAL
    // ...
  },
});

// In Repository - Convert to Number
private mapToEntity(prismaData: any): SalaryStructureEntity {
  return new SalaryStructureEntity({
    baseSalary: Number(prismaData.baseSalary), // Convert back
    // ...
  });
}
```

### 2. Loan Installment Payment (Transaction Required)
```typescript
async execute(loanId: string, dto: PayLoanInstallmentDto): Promise<EmployeeLoanEntity> {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Get loan
    const loan = await tx.employeeLoan.findUnique({ where: { id: loanId } });

    // 2. Validate can pay
    if (!loan.canPayInstallment()) throw new BadRequestException(...);

    // 3. Create deduction
    await tx.employeeDeduction.create({
      data: {
        employeeId: loan.employeeId,
        deductionType: 'LOAN_REPAYMENT',
        amount: new Prisma.Decimal(loan.installmentAmount),
        loanId: loanId,
        deductionDate: new Date(),
        // ...
      },
    });

    // 4. Update loan
    const newPaidInstallments = loan.paidInstallments + 1;
    const newRemainingAmount = loan.remainingAmount - loan.installmentAmount;
    const newStatus = newPaidInstallments >= loan.installments ? 'PAID_OFF' : 'ACTIVE';

    return await tx.employeeLoan.update({
      where: { id: loanId },
      data: {
        paidInstallments: newPaidInstallments,
        remainingAmount: new Prisma.Decimal(newRemainingAmount),
        status: newStatus,
        endDate: newStatus === 'PAID_OFF' ? new Date() : undefined,
      },
    });
  });
}
```

### 3. Logger Usage (Following Assets Module Fix)
```typescript
// Use logger.log() with template strings, NOT objects
this.logger.log(`Creating salary structure for employee: ${dto.employeeId}`);
// NOT: this.logger.log('Creating...', { employeeId: dto.employeeId });
```

### 4. Approval Workflow Pattern
```typescript
// In approve use case:
async execute(id: string, dto: ApproveDto, userId: string): Promise<Entity> {
  const entity = await this.repository.findById(id);
  if (!entity) throw new NotFoundException(...);
  if (entity.isApproved()) throw new BadRequestException('Already approved');
  if (entity.isRejected()) throw new BadRequestException('Cannot approve rejected item');

  return await this.repository.approve(id, dto.notes, userId);
}

// In repository:
async approve(id: string, notes: string, userId: string): Promise<Entity> {
  const updated = await this.prisma.model.update({
    where: { id },
    data: {
      approvedBy: userId,
      approvedAt: new Date(),
      notes: notes,
    },
  });
  return this.mapToEntity(updated);
}
```

## File Count Summary
- Entities: 5 files
- DTOs: 26 files + index.ts
- Repositories: 5 implementations + index.ts (interfaces)
- Use Cases: 35 files + index.ts
- Controllers: 1 file
- Decorators: 1 file (Swagger)
- Module: 1 file
- Documentation: 1 file

**Total: ~76 new files**

## Success Criteria
1. All TypeScript compilation passes without errors
2. Build succeeds with `npm run build`
3. Module properly registered in app.module.ts
4. All endpoints documented in Swagger
5. Decimal precision maintained for all financial fields
6. Transactions used for critical operations (loan payments)
7. Approval workflows functional
8. Logger integration working correctly

## Implementation Order
1. Create entities (5 files)
2. Create all DTOs (27 files)
3. Create repository interfaces and index (1 file)
4. Create repository implementations (5 files)
5. Create all use cases (36 files)
6. Create Swagger decorators (1 file)
7. Create controller (1 file)
8. Create module file (1 file)
9. Register in app.module.ts
10. Create API documentation (1 file)
11. Build and verify
