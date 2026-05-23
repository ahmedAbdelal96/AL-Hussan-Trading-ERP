/**
 * Employee Deductions API Service
 *
 * Manages salary deductions with type-based approval logic.
 * Some deduction types (TAX, INSURANCE, LOAN_REPAYMENT) are auto-approved,
 * while others (PENALTY, ABSENCE, OTHER) require manual approval.
 *
 * @module EmployeeDeductionsApi
 */

import { apiClient } from "./axiosConfig";
import type {
  EmployeeDeductionEntity,
  CreateEmployeeDeductionDto,
  UpdateEmployeeDeductionDto,
  EmployeeDeductionFiltersDto,
  EmployeeDeductionListResponse,
  EmployeeDeductionStatisticsResponse,
  ApproveEmployeeDeductionDto,
  RejectEmployeeDeductionDto,
  UnapproveEmployeeDeductionDto,
} from "@/types/payroll.types";

const BASE_URL = "/payroll/deductions";

/**
 * Employee Deductions API Service
 * Provides CRUD operations for employee salary deductions
 */
export const employeeDeductionsApi = {
  /**
   * Get all employee deductions with optional filters
   * Supports filtering by employee, type, loan, date ranges, and approval status
   *
   * @param filters - Query parameters for filtering and pagination
   * @returns Paginated list of employee deductions
   */
  getAll: async (
    filters: Partial<EmployeeDeductionFiltersDto> = {},
  ): Promise<EmployeeDeductionListResponse> => {
    const { data } = await apiClient.get<EmployeeDeductionListResponse>(
      BASE_URL,
      {
        params: filters,
      },
    );
    return data;
  },

  /**
   * Get deductions for a specific employee
   * Useful for employee detail pages and payroll calculations
   *
   * @param employeeId - Employee UUID
   * @returns Array of employee deductions
   */
  getByEmployee: async (
    employeeId: string,
  ): Promise<EmployeeDeductionEntity[]> => {
    const { data } = await apiClient.get<EmployeeDeductionEntity[]>(
      `${BASE_URL}/employee/${employeeId}`,
    );
    return data;
  },

  /**
   * Get a single employee deduction by ID
   *
   * @param id - Employee deduction UUID
   * @returns Employee deduction entity with optional loan relation
   * @throws {404} If deduction not found
   */
  getById: async (id: string): Promise<EmployeeDeductionEntity> => {
    const { data } = await apiClient.get<EmployeeDeductionEntity>(
      `${BASE_URL}/${id}`,
    );
    return data;
  },

  /**
   * Create a new employee deduction
   *
   * Auto-approval logic (no approval required):
   * - TAX: Tax deductions are auto-approved
   * - INSURANCE: Insurance deductions are auto-approved
   * - LOAN_REPAYMENT: Loan repayments are auto-approved (usually system-generated)
   *
   * Manual approval required:
   * - PENALTY: Requires approval
   * - ABSENCE: Requires approval
   * - ADVANCE_DEDUCTION: Requires approval
   * - OTHER: Requires approval
   *
   * @param payload - Employee deduction creation data
   * @returns Created employee deduction entity
   * @throws {400} If validation fails
   */
  create: async (
    payload: CreateEmployeeDeductionDto,
  ): Promise<EmployeeDeductionEntity> => {
    const { data } = await apiClient.post<EmployeeDeductionEntity>(
      BASE_URL,
      payload,
    );
    return data;
  },

  /**
   * Update an existing employee deduction
   * Can modify type, amount, date, reason, and notes
   *
   * @param id - Employee deduction UUID
   * @param payload - Fields to update (partial update supported)
   * @returns Updated employee deduction entity
   * @throws {404} If deduction not found
   */
  update: async (
    id: string,
    payload: UpdateEmployeeDeductionDto,
  ): Promise<EmployeeDeductionEntity> => {
    const { data } = await apiClient.patch<EmployeeDeductionEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Delete an employee deduction
   * Note: LOAN_REPAYMENT deductions tied to loans may not be deletable
   *
   * @param id - Employee deduction UUID
   * @throws {404} If deduction not found
   * @throws {400} If deduction cannot be deleted
   */
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`, {
      data: options?.rowVersion ? { rowVersion: options.rowVersion } : undefined,
    });
  },

  getStatistics: async (
    filters: Partial<EmployeeDeductionFiltersDto> = {},
  ): Promise<EmployeeDeductionStatisticsResponse> => {
    const { data } = await apiClient.get<EmployeeDeductionStatisticsResponse>(
      `${BASE_URL}/statistics`,
      {
        params: filters,
      },
    );
    return data;
  },

  /**
   * Approve an employee deduction
   * Requires payroll:approve permission
   * Only works for deduction types that require approval:
   * - PENALTY
   * - ABSENCE
   * - ADVANCE_DEDUCTION
   * - OTHER
   *
   * @param id - Employee deduction UUID
   * @param payload - Approval data (optional notes)
   * @returns Approved employee deduction entity
   * @throws {404} If deduction not found
   * @throws {400} If deduction already approved/rejected or doesn't require approval
   */
  approve: async (
    id: string,
    payload: ApproveEmployeeDeductionDto,
  ): Promise<EmployeeDeductionEntity> => {
    const { data } = await apiClient.post<EmployeeDeductionEntity>(
      `${BASE_URL}/${id}/approve`,
      payload,
    );
    return data;
  },

  /**
   * Reject an employee deduction
   * Requires payroll:approve permission
   * Must provide a rejection reason for audit trail
   *
   * @param id - Employee deduction UUID
   * @param payload - Rejection data with reason (required)
   * @returns Rejected employee deduction entity
   * @throws {404} If deduction not found
   * @throws {400} If deduction already approved/rejected
   */
  reject: async (
    id: string,
    payload: RejectEmployeeDeductionDto,
  ): Promise<EmployeeDeductionEntity> => {
    const { data } = await apiClient.post<EmployeeDeductionEntity>(
      `${BASE_URL}/${id}/reject`,
      payload,
    );
    return data;
  },

  /**
   * Unapprove (cancel approval) an employee deduction
   * Requires payroll:approve permission
   * Only allowed if the salary for this period has not been paid yet
   *
   * @param id - Employee deduction UUID
   * @param payload - Unapproval data (optional notes explaining why)
   * @returns Unapproved employee deduction entity
   * @throws {404} If deduction not found
   * @throws {400} If deduction not approved, or salary already paid
   */
  unapprove: async (
    id: string,
    payload: UnapproveEmployeeDeductionDto,
  ): Promise<EmployeeDeductionEntity> => {
    const { data } = await apiClient.post<EmployeeDeductionEntity>(
      `${BASE_URL}/${id}/unapprove`,
      payload,
    );
    return data;
  },

  /**
   * Restore a soft-deleted employee deduction
   * Only accessible to SUPERADMIN
   *
   * @param id - Employee deduction ID
   * @returns Restored employee deduction entity
   * @throws {404} If deduction not found
   * @throws {400} If deduction is not deleted
   * @throws {403} If user is not SUPERADMIN
   */
  restore: async (id: string): Promise<EmployeeDeductionEntity> => {
    const { data } = await apiClient.post<EmployeeDeductionEntity>(
      `${BASE_URL}/${id}/restore`,
    );
    return data;
  },

  /**
   * Get all soft-deleted employee deductions
   * Only accessible to SUPERADMIN
   *
   * @param filters - Optional filters (employeeId, deductionType, dateRange, etc.)
   * @returns Paginated list of deleted employee deductions
   * @throws {403} If user is not SUPERADMIN
   */
  listDeleted: async (
    filters?: Partial<EmployeeDeductionFiltersDto>,
  ): Promise<EmployeeDeductionListResponse> => {
    const { data } = await apiClient.get<EmployeeDeductionListResponse>(
      `${BASE_URL}/deleted`,
      { params: filters },
    );
    return data;
  },
};
