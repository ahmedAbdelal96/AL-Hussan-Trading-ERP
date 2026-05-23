import {
  AllowanceTypeEntity,
  EmployeeAllowanceEntity,
  EmployeeLoanEntity,
  EmployeeDeductionEntity,
} from '../entities';
import {
  CreateAllowanceTypeDto,
  UpdateAllowanceTypeDto,
  AllowanceTypeFiltersDto,
  CreateEmployeeAllowanceDto,
  UpdateEmployeeAllowanceDto,
  EmployeeAllowanceFiltersDto,
  CreateEmployeeLoanDto,
  UpdateEmployeeLoanDto,
  EmployeeLoanFiltersDto,
  CreateEmployeeDeductionDto,
  UpdateEmployeeDeductionDto,
  EmployeeDeductionFiltersDto,
} from '../dto';
import { DeductionType, LoanRepaymentSource, LoanStatus } from '@prisma/client';

// ============================================================================
// REPOSITORY SYMBOLS
// ============================================================================

export const ALLOWANCE_TYPE_REPOSITORY = Symbol('ALLOWANCE_TYPE_REPOSITORY');
export const EMPLOYEE_ALLOWANCE_REPOSITORY = Symbol(
  'EMPLOYEE_ALLOWANCE_REPOSITORY',
);
export const EMPLOYEE_LOAN_REPOSITORY = Symbol('EMPLOYEE_LOAN_REPOSITORY');
export const EMPLOYEE_DEDUCTION_REPOSITORY = Symbol(
  'EMPLOYEE_DEDUCTION_REPOSITORY',
);
export const PAYSLIP_REPOSITORY = Symbol('PAYSLIP_REPOSITORY');

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Allowance Type Repository Interface
 * Manages allowance type master data
 */
export interface IAllowanceTypeRepository {
  create(
    data: CreateAllowanceTypeDto,
    userId: string,
  ): Promise<AllowanceTypeEntity>;
  findById(id: string): Promise<AllowanceTypeEntity | null>;
  findAll(filters: AllowanceTypeFiltersDto): Promise<{
    data: AllowanceTypeEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(
    id: string,
    data: UpdateAllowanceTypeDto,
  ): Promise<AllowanceTypeEntity>;
  delete(id: string, rowVersion?: number): Promise<void>;
  findAllActive(): Promise<AllowanceTypeEntity[]>;
  findByName(name: string): Promise<AllowanceTypeEntity | null>;
  getStatistics(filters?: { search?: string }): Promise<{
    total: number;
    active: number;
    inactive: number;
  }>;
}

/**
 * Employee Allowance Repository Interface
 * Manages employee allowance assignments with approval workflow
 */
export interface IEmployeeAllowanceRepository {
  create(
    data: CreateEmployeeAllowanceDto,
    userId: string,
  ): Promise<EmployeeAllowanceEntity>;
  findById(id: string): Promise<EmployeeAllowanceEntity | null>;
  findAll(filters: EmployeeAllowanceFiltersDto): Promise<{
    data: EmployeeAllowanceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(
    id: string,
    data: UpdateEmployeeAllowanceDto,
  ): Promise<EmployeeAllowanceEntity>;
  delete(id: string, userId?: string, rowVersion?: number): Promise<void>;
  restore(id: string): Promise<EmployeeAllowanceEntity>;
  findDeleted(filters: EmployeeAllowanceFiltersDto): Promise<{
    data: EmployeeAllowanceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByEmployeeId(employeeId: string): Promise<EmployeeAllowanceEntity[]>;
  findActiveByEmployeeId(
    employeeId: string,
  ): Promise<EmployeeAllowanceEntity[]>;
  findActiveByEmployeeIdAtDate(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<EmployeeAllowanceEntity[]>;
  findPendingApprovals(): Promise<EmployeeAllowanceEntity[]>;
  approve(
    id: string,
    userId: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeAllowanceEntity>;
  reject(
    id: string,
    userId: string,
    reason: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeAllowanceEntity>;
  getStatistics(filters?: {
    employeeId?: string;
    allowanceTypeId?: string;
    frequency?: string;
  }): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>;
}

/**
 * Employee Loan Repository Interface
 * Manages employee loans with installment tracking and payment processing
 */
export interface IEmployeeLoanRepository {
  create(
    data: CreateEmployeeLoanDto,
    userId: string,
  ): Promise<EmployeeLoanEntity>;
  findById(id: string): Promise<EmployeeLoanEntity | null>;
  findAll(filters: EmployeeLoanFiltersDto): Promise<{
    data: EmployeeLoanEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(id: string, data: UpdateEmployeeLoanDto): Promise<EmployeeLoanEntity>;
  delete(id: string, rowVersion?: number): Promise<void>;
  findAllByEmployeeId(employeeId: string): Promise<EmployeeLoanEntity[]>;
  findActiveByEmployeeId(employeeId: string): Promise<EmployeeLoanEntity[]>;
  findActiveByEmployeeIdAtDate(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<EmployeeLoanEntity[]>;
  findPendingApprovals(): Promise<EmployeeLoanEntity[]>;
  approve(
    id: string,
    userId: string,
    notes?: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeLoanEntity>;
  reject(
    id: string,
    userId: string,
    reason: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeLoanEntity>;
  payInstallment(
    loanId: string,
    userId: string,
    paymentDate: Date,
    expectedRowVersion?: number,
    source?: LoanRepaymentSource,
  ): Promise<EmployeeLoanEntity>;
  findByStatus(status: LoanStatus): Promise<EmployeeLoanEntity[]>;
  getStatistics(filters?: { employeeId?: string }): Promise<{
    total: number;
    pending: number;
    active: number;
    completed: number;
  }>;
}

/**
 * Employee Deduction Repository Interface
 * Manages employee deductions including loan repayments
 */
export interface IEmployeeDeductionRepository {
  create(
    data: CreateEmployeeDeductionDto,
    userId: string,
  ): Promise<EmployeeDeductionEntity>;
  findById(id: string): Promise<EmployeeDeductionEntity | null>;
  findAll(filters: EmployeeDeductionFiltersDto): Promise<{
    data: EmployeeDeductionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(
    id: string,
    data: UpdateEmployeeDeductionDto,
  ): Promise<EmployeeDeductionEntity>;
  delete(id: string, userId?: string, rowVersion?: number): Promise<void>;
  findByEmployeeId(employeeId: string): Promise<EmployeeDeductionEntity[]>;
  findByLoanId(loanId: string): Promise<EmployeeDeductionEntity[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    employeeId?: string,
  ): Promise<EmployeeDeductionEntity[]>;
  getTotalByType(
    employeeId: string,
    deductionType: DeductionType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number>;
  approve(
    id: string,
    userId: string,
    notes?: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeDeductionEntity>;
  reject(
    id: string,
    userId: string,
    rejectionReason: string,
    expectedRowVersion?: number,
  ): Promise<void>;
  unapprove(
    id: string,
    notes?: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeDeductionEntity>;
  restore(id: string): Promise<EmployeeDeductionEntity>;
  findDeleted(filters: EmployeeDeductionFiltersDto): Promise<{
    data: EmployeeDeductionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  getStatistics(filters?: {
    employeeId?: string;
    deductionType?: DeductionType;
    loanId?: string;
  }): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>;
}

// Export repository implementations
export * from './allowance-type.repository';
export * from './employee-allowance.repository';
export * from './employee-loan.repository';
export * from './employee-deduction.repository';
export * from './payslip.repository';
