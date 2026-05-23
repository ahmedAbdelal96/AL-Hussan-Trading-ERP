/**
 * Payroll Module - TypeScript Type Definitions
 *
 * This file contains all type definitions for the Payroll module including:
 * - Entity interfaces (5 entities)
 * - DTOs for Create/Update operations
 * - Filter DTOs for queries
 * - Response DTOs with pagination
 * - Enums for status and types
 * - Summary and calculation types
 *
 * All types are aligned with backend API specifications to ensure type safety
 * across the frontend-backend communication layer.
 *
 * @module PayrollTypes
 */

// ============================================================================
// ENUMS - Status and Type Definitions
// ============================================================================

/**
 * Allowance Frequency Enum
 * Defines how often an allowance is paid to an employee
 */
export enum AllowanceFrequency {
  ONE_TIME = "ONE_TIME", // One-time payment
  DAILY = "DAILY", // Daily payment (× 30 = monthly)
  WEEKLY = "WEEKLY", // Weekly payment (× 4.33 = monthly)
  MONTHLY = "MONTHLY", // Monthly payment
  QUARTERLY = "QUARTERLY", // Quarterly payment (÷ 3 = monthly)
  ANNUALLY = "ANNUALLY", // Annual payment (÷ 12 = monthly)
}

/**
 * Allowance Status Enum
 * Simple 3-state workflow: PENDING → APPROVED or REJECTED
 */
export enum AllowanceStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// ============================================================================
// USER INFO - For Audit Field Enrichment
// ============================================================================

/**
 * User Info Interface
 * Lightweight user information for displaying audit fields
 * (createdBy, deletedBy, approvedBy, etc.)
 */
export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

/**
 * Get full name from UserInfo
 * @param user - UserInfo object or null/undefined
 * @returns Full name or "-" if user is null
 */
export function getUserFullName(user: UserInfo | null | undefined): string {
  if (!user) return "-";
  return `${user.firstName} ${user.lastName}`.trim();
}

// ============================================================================
// ENTITIES - Database Models
// ============================================================================

/**
 * Loan Status Enum
 * Workflow: PENDING → APPROVED or REJECTED → COMPLETED (set automatically on last installment)
 */
export enum LoanStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED", // All installments paid — set by backend automatically
}

/**
 * Deduction Status Enum
 * Simple 3-state workflow: PENDING → APPROVED or REJECTED
 */
export enum DeductionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

/**
 * Deduction Type Enum
 * Categories for salary deductions
 */
export enum DeductionType {
  LOAN_REPAYMENT = "LOAN_REPAYMENT", // Loan installment (auto-approved)
  INSURANCE = "INSURANCE", // Insurance deduction (auto-approved)
  TAX = "TAX", // Tax deduction (auto-approved)
  PENALTY = "PENALTY", // Penalty (requires approval)
  ADVANCE_DEDUCTION = "ADVANCE_DEDUCTION", // Advance deduction (requires approval)
  ABSENCE = "ABSENCE", // Absence deduction (requires approval)
  OTHER = "OTHER", // Other deduction (requires approval)
}

// ============================================================================
// ENTITY INTERFACES - Domain Models
// ============================================================================

/**
 * Allowance Type Entity
 * Master data catalog of available allowance types
 * Provides flexibility to add new allowance types anytime
 */
export interface AllowanceTypeEntity {
  id: string;
  name: string;
  description?: string | null;
  defaultAmount?: number | null;
  isActive: boolean;
  rowVersion: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Employee Allowance Entity
 * Represents a specific allowance assigned to an employee
 *
 * Features:
 * - Full lifecycle management (pending → active → suspended/cancelled)
 * - Approval workflow with rejection tracking
 * - Suspension support for temporary holds (e.g., unpaid leave)
 * - Cancellation for permanent stops
 * - Audit trail with user tracking for all state changes
 */
export interface EmployeeAllowanceEntity {
  id: string;
  employeeId: string;
  allowanceTypeId: string;
  amount: number;
  frequency: AllowanceFrequency;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  status: AllowanceStatus;
  notes?: string | null;

  // Approval tracking
  approvedBy?: string | null;
  approvedAt?: Date | string | null;

  // Rejection tracking
  rejectedBy?: string | null;
  rejectedAt?: Date | string | null;
  rejectionReason?: string | null;

  // Soft Delete
  deletedAt?: Date | string | null;
  deletedBy?: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  rowVersion: number;

  // User Info (Enriched from User table)
  createdByUser?: UserInfo | null;
  approvedByUser?: UserInfo | null;
  rejectedByUser?: UserInfo | null;
  deletedByUser?: UserInfo | null;

  // Relations
  allowanceType?: AllowanceTypeEntity;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    employeeNumber: string;
  };
}

/**
 * Employee Loan Entity
 * Represents a loan given to an employee with installment tracking
 */
export interface EmployeeLoanEntity {
  id: string;
  employeeId: string;
  amount: number;
  remainingAmount: number;
  installments: number;
  paidInstallments: number;
  installmentAmount: number;
  startDate: Date | string;
  endDate: Date | string;
  status: LoanStatus;
  purpose?: string | null;
  notes?: string | null;

  // Approval
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  rejectedReason?: string | null;
  rowVersion: number;

  // Soft Delete
  deletedAt?: Date | string | null;
  deletedBy?: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;

  // User Info (Enriched from User table)
  createdByUser?: UserInfo | null;
  approvedByUser?: UserInfo | null;
  deletedByUser?: UserInfo | null;

  // Relations
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    employeeNumber: string;
  };
}

/**
 * Employee Deduction Entity
 * Represents a deduction from employee salary
 */
export interface EmployeeDeductionEntity {
  id: string;
  employeeId: string;
  deductionType: DeductionType;
  amount: number;
  deductionDate: Date | string;
  loanId?: string | null;
  repaymentSource?: "MANUAL" | "PAYROLL_PROCESS" | null;
  reason?: string | null;
  notes?: string | null;

  status: DeductionStatus;
  rowVersion: number;

  // Approval
  approvedBy?: string | null;
  approvedAt?: Date | string | null;

  // Rejection
  rejectedBy?: string | null;
  rejectedAt?: Date | string | null;
  rejectedReason?: string | null;

  // Soft Delete
  deletedAt?: Date | string | null;
  deletedBy?: string | null;

  createdAt: Date | string;
  createdBy: string;

  // User Info (Enriched from User table)
  createdByUser?: UserInfo | null;
  approvedByUser?: UserInfo | null;
  rejectedByUser?: UserInfo | null;
  deletedByUser?: UserInfo | null;

  // Relations
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    employeeNumber: string;
  };
  loan?: EmployeeLoanEntity;
}

// ============================================================================
// CREATE DTOs - Data Transfer Objects for Creation
// ============================================================================

/**
 * Create Allowance Type DTO
 */
export interface CreateAllowanceTypeDto {
  name: string;
  description?: string;
  defaultAmount?: number;
  isActive?: boolean;
}

/**
 * Create Employee Allowance DTO
 */
export interface CreateEmployeeAllowanceDto {
  employeeId: string;
  allowanceTypeId: string;
  amount?: number;
  frequency: AllowanceFrequency;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
  notes?: string;
}

/**
 * Create Employee Loan DTO
 */
export interface CreateEmployeeLoanDto {
  employeeId: string;
  amount: number;
  installments: number;
  startDate: string;
  endDate?: string;
  purpose?: string;
  notes?: string;
}

/**
 * Create Employee Deduction DTO
 */
export interface CreateEmployeeDeductionDto {
  employeeId: string;
  deductionType: DeductionType;
  amount: number;
  deductionDate: string;
  loanId?: string;
  reason?: string;
  notes?: string;
}

// ============================================================================
// UPDATE DTOs - Data Transfer Objects for Updates
// ============================================================================

/**
 * Update Allowance Type DTO
 */
export interface UpdateAllowanceTypeDto {
  name?: string;
  description?: string;
  defaultAmount?: number;
  isActive?: boolean;
  rowVersion?: number;
}

/**
 * Update Employee Allowance DTO
 */
export interface UpdateEmployeeAllowanceDto {
  amount?: number;
  frequency?: AllowanceFrequency;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
  notes?: string;
  rowVersion?: number;
}

/**
 * Update Employee Loan DTO
 */
export interface UpdateEmployeeLoanDto {
  amount?: number;
  installments?: number;
  startDate?: string;
  endDate?: string;
  purpose?: string;
  notes?: string;
  rowVersion?: number;
}

/**
 * Update Employee Deduction DTO
 */
export interface UpdateEmployeeDeductionDto {
  deductionType?: DeductionType;
  amount?: number;
  deductionDate?: string;
  reason?: string;
  notes?: string;
  rowVersion?: number;
}

// ============================================================================
// FILTER DTOs - Query Parameters for List Operations
// ============================================================================

/**
 * Base Pagination Filters
 * Common pagination parameters used across all list queries
 */
export interface BasePaginationFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Allowance Type Filters
 */
export interface AllowanceTypeFiltersDto extends BasePaginationFilters {
  isActive?: boolean;
  search?: string;
}

/**
 * Employee Allowance Filters
 */
export interface EmployeeAllowanceFiltersDto extends BasePaginationFilters {
  search?: string;
  employeeId?: string;
  allowanceTypeId?: string;
  frequency?: AllowanceFrequency;
  approvalStatus?: AllowanceStatus;
  isActive?: boolean;
  isApproved?: boolean;
  minAmount?: number;
  maxAmount?: number;
  startDateFrom?: string;
  startDateTo?: string;
}

/**
 * Employee Loan Filters
 */
export interface EmployeeLoanFiltersDto extends BasePaginationFilters {
  search?: string;
  employeeId?: string;
  status?: LoanStatus;
  approvalStatus?: LoanStatus;
  paymentStatus?: string;
  startDateFrom?: string;
  startDateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  pageSize?: number;
}

/**
 * Employee Deduction Filters
 */
export interface EmployeeDeductionFiltersDto extends BasePaginationFilters {
  search?: string;
  employeeId?: string;
  deductionType?: DeductionType;
  deductionTypeId?: string; // Alias used by filter components
  frequency?: string; // Optional frequency filter (not persisted to backend)
  loanId?: string;
  status?: DeductionStatus;
  startDate?: string;
  endDate?: string;
  startDateFrom?: string;
  startDateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Payroll Summary Filters
 */
export interface PayrollSummaryFiltersDto {
  employeeIds?: string[];
  periodStart?: string;
  periodEnd?: string;
}

// ============================================================================
// RESPONSE DTOs - API Response Structures
// ============================================================================

/**
 * Paginated List Response
 * Generic response structure for paginated list queries
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Allowance Type List Response
 */
export type AllowanceTypeListResponse = PaginatedResponse<AllowanceTypeEntity>;

/**
 * Employee Allowance List Response
 */
export type EmployeeAllowanceListResponse =
  PaginatedResponse<EmployeeAllowanceEntity>;

/**
 * Employee Loan List Response
 */
export type EmployeeLoanListResponse = PaginatedResponse<EmployeeLoanEntity>;

/**
 * Employee Deduction List Response
 */
export type EmployeeDeductionListResponse =
  PaginatedResponse<EmployeeDeductionEntity>;

export interface AllowanceTypeStatisticsResponse {
  total: number;
  active: number;
  inactive: number;
}

export interface EmployeeAllowanceStatisticsResponse {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface EmployeeDeductionStatisticsResponse {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface EmployeeLoanStatisticsResponse {
  total: number;
  pending: number;
  active: number;
  completed: number;
}

// ============================================================================
// APPROVAL DTOs - Approval Workflow Operations
// ============================================================================

/**
 * Approve Employee Allowance DTO
 */
export interface ApproveEmployeeAllowanceDto {
  notes?: string;
  rowVersion?: number;
}

/**
 * Reject Employee Allowance DTO
 */
export interface RejectEmployeeAllowanceDto {
  rejectionReason: string;
  rowVersion?: number;
}

/**
 * Approve Employee Loan DTO
 */
export interface ApproveEmployeeLoanDto {
  notes?: string;
  rowVersion?: number;
}

/**
 * Reject Employee Loan DTO
 */
export interface RejectEmployeeLoanDto {
  rejectedReason: string;
  rowVersion?: number;
}

/**
 * Pay Loan Installment DTO
 */
export interface PayLoanInstallmentDto {
  deductionDate: string;
  notes?: string;
  rowVersion?: number;
}

/**
 * Approve Employee Deduction DTO
 */
export interface ApproveEmployeeDeductionDto {
  notes?: string;
  rowVersion?: number;
}

/**
 * Reject Employee Deduction DTO
 */
export interface RejectEmployeeDeductionDto {
  rejectionReason: string;
  rowVersion?: number;
}

/**
 * Unapprove Employee Deduction DTO
 */
export interface UnapproveEmployeeDeductionDto {
  notes?: string;
  rowVersion?: number;
}

// ============================================================================
// SUMMARY & CALCULATION DTOs - Payroll Reports
// ============================================================================

/**
 * Allowance Breakdown Item
 * Represents a single allowance in the payroll summary
 */
export interface AllowanceBreakdownDto {
  allowanceType: string;
  amount: number;
  frequency: AllowanceFrequency;
  monthlyEquivalent: number;
}

/**
 * Deduction Breakdown Item
 * Represents a single deduction in the payroll summary
 */
export interface DeductionBreakdownDto {
  deductionType: DeductionType;
  amount: number;
  description?: string;
}

/**
 * Employee Payroll Summary
 * Complete salary calculation for an employee
 * Formula: netSalary = baseSalary + totalAllowances - totalDeductions
 */
export interface EmployeePayrollSummaryDto {
  employeeId: string;
  employeeName?: string;
  baseSalary: number;
  totalAllowances: number;
  allowanceBreakdown: AllowanceBreakdownDto[];
  totalDeductions: number;
  deductionBreakdown: DeductionBreakdownDto[];
  netSalary: number;
  currency?: string;
  periodStart?: Date | string;
  periodEnd?: Date | string;
}

// ============================================================================
// HELPER TYPES - Utility Types for UI Components
// ============================================================================

/**
 * Loan Progress Info
 * Calculated loan progress data for UI
 */
export interface LoanProgressInfo {
  loanId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  progressPercentage: number;
  nextPaymentDate?: Date | string;
  status: LoanStatus;
}

/**
 * Monthly Equivalent Calculation Result
 * Used for allowance frequency conversions
 */
export interface MonthlyEquivalentResult {
  originalAmount: number;
  frequency: AllowanceFrequency;
  monthlyEquivalent: number;
  annualEquivalent: number;
}

/**
 * Deduction Approval Status
 * Indicates if a deduction requires approval
 */
export interface DeductionApprovalStatus {
  requiresApproval: boolean;
  isApproved: boolean;
  isPending: boolean;
}

// ============================================================================
// FORM VALUES - Zod Schema Types (for react-hook-form)
// ============================================================================

/**
 * Employee Allowance Form Values
 */
export interface EmployeeAllowanceFormValues {
  employeeId: string;
  allowanceTypeId: string;
  amount: string | number;
  frequency: AllowanceFrequency;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string;
  isActive: boolean;
  notes?: string;
}

/**
 * Employee Loan Form Values
 */
export interface EmployeeLoanFormValues {
  employeeId: string;
  amount: string | number;
  installments: string | number;
  startDate: Date | string;
  endDate: Date | string;
  purpose?: string;
  notes?: string;
}

/**
 * Employee Deduction Form Values
 */
export interface EmployeeDeductionFormValues {
  employeeId: string;
  deductionType: DeductionType;
  amount: string | number;
  deductionDate: Date | string;
  loanId?: string;
  reason?: string;
  notes?: string;
}

/**
 * Payroll Summary (Aggregated)
 * Used for dashboard and summary views showing totals across employees
 */
export interface PayrollSummary {
  totalPayroll: number;
  totalSalaries: number;
  totalAllowances: number;
  totalDeductions: number;
  totalLoanPayments: number;
  employeeCount: number;
  periodStart?: Date | string;
  periodEnd?: Date | string;
  currency?: string;
}

// ============================================================================
// PAYSLIP TYPES - Salary Slip Generation & Management
// ============================================================================

/**
 * Payment Method Enum
 * Methods used for salary payment
 */
export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHECK = "CHECK",
}

/**
 * Payslip Entity
 * Represents a monthly salary slip for an employee
 */
export interface PayslipEntity {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    departmentId: string | null;
    departmentName: string | null;
    positionId: string | null;
    positionName: string | null;
  };

  // Period
  payPeriodMonth: number;
  payPeriodYear: number;
  payDate: string;

  // Salary components
  baseSalary: string | number;
  housingAllowance: string | number;
  transportAllowance: string | number;
  foodAllowance: string | number;
  otherAllowances: string | number;
  totalAllowances: string | number;
  grossSalary: string | number;

  // Deductions
  insuranceDeduction: string | number;
  taxDeduction: string | number;
  loanDeduction: string | number;
  absenceDeduction: string | number;
  otherDeductions: string | number;
  totalDeductions: string | number;
  netSalary: string | number;

  // Working info
  workingDays: number;
  absentDays: number;
  overtimeHours: string | number;
  overtimeAmount: string | number;

  // Payment status
  isPaid: boolean;
  paidAt?: string | null;
  paidBy?: string | null;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
  paymentNotes?: string | null;

  processedAt: string;
  processedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Process Payroll DTO
 * Request to generate payslips for a specific period
 */
export interface ProcessPayrollDto {
  payPeriodMonth: number;
  payPeriodYear: number;
  payDate?: string;
  employeeIds?: string[];
  notes?: string;
}

/**
 * Process Payroll Response
 * Result of payroll processing with statistics
 */
export interface ProcessPayrollResponseDto {
  totalProcessed: number;
  successful: number;
  failed: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  payslips: PayslipEntity[];
  errors?: {
    employeeId: string;
    employeeName: string;
    error: string;
  }[];
}

/**
 * Update Payslip Payment DTO
 * Request to update payment status
 */
export interface UpdatePayslipPaymentDto {
  isPaid: boolean;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  paymentNotes?: string;
}

/**
 * Payslip Filters DTO
 * Filter options for payslip queries
 */
export interface PayslipFiltersDto {
  employeeId?: string;
  payPeriodMonth?: number;
  payPeriodYear?: number;
  isPaid?: boolean;
  departmentId?: string; // Filter by department ID (FK)
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated Payslips Response
 */
export interface PaginatedPayslipsDto {
  data: PayslipEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  paidCount?: number;
  unpaidCount?: number;
  totalNetAmount?: number;
}

export interface PayslipStatisticsDto {
  total: number;
  paidCount: number;
  unpaidCount: number;
  totalNetAmount: number;
}

/**
 * Payslip Form Values
 * For manual payslip creation (if needed)
 */
export interface PayslipFormValues {
  employeeId: string;
  payPeriodMonth: number;
  payPeriodYear: number;
  payDate: Date | string;
  notes?: string;
}
