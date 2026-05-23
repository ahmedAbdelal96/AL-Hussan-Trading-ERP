/**
 * Employee Loans API Service
 *
 * Manages employee loans with installment tracking and payment processing.
 * Loans go through an approval workflow and track payment progress over time.
 *
 * Workflow: Create → Pending → Approved → Active → Paid Off
 *
 * @module EmployeeLoansApi
 */

import { apiClient } from "./axiosConfig";
import type {
  EmployeeLoanEntity,
  CreateEmployeeLoanDto,
  UpdateEmployeeLoanDto,
  EmployeeLoanFiltersDto,
  EmployeeLoanListResponse,
  EmployeeLoanStatisticsResponse,
  ApproveEmployeeLoanDto,
  RejectEmployeeLoanDto,
  PayLoanInstallmentDto,
} from "@/types/payroll.types";

const BASE_URL = "/payroll/loans";

/**
 * Employee Loans API Service
 * Provides comprehensive loan management including creation, approval, and payment tracking
 */
export const employeeLoansApi = {
  /**
   * Get all employee loans with optional filters
   * Supports filtering by employee, status, date ranges, and amount ranges
   *
   * @param filters - Query parameters for filtering and pagination
   * @returns Paginated list of employee loans
   */
  getAll: async (
    filters: Partial<EmployeeLoanFiltersDto> = {},
  ): Promise<EmployeeLoanListResponse> => {
    const { data } = await apiClient.get<EmployeeLoanListResponse>(BASE_URL, {
      params: filters,
    });
    return data;
  },

  /**
   * Get loans for a specific employee
   * Useful for employee detail pages and loan history
   *
   * @param employeeId - Employee UUID
   * @returns Array of employee loans
   */
  getByEmployee: async (employeeId: string): Promise<EmployeeLoanEntity[]> => {
    const { data } = await apiClient.get<EmployeeLoanEntity[]>(
      `${BASE_URL}/employee/${employeeId}`,
    );
    return data;
  },

  /**
   * Get a single employee loan by ID
   *
   * @param id - Employee loan UUID
   * @returns Employee loan entity with payment history
   * @throws {404} If loan not found
   */
  getById: async (id: string): Promise<EmployeeLoanEntity> => {
    const { data } = await apiClient.get<EmployeeLoanEntity>(
      `${BASE_URL}/${id}`,
    );
    return data;
  },

  /**
   * Create a new employee loan
   * Initial status will be PENDING, awaiting approval
   * Installment amount is auto-calculated: totalAmount ÷ numberOfInstallments
   *
   * @param payload - Employee loan creation data
   * @returns Created employee loan entity
   * @throws {400} If validation fails or employee already has active loan
   */
  create: async (
    payload: CreateEmployeeLoanDto,
  ): Promise<EmployeeLoanEntity> => {
    const { data } = await apiClient.post<EmployeeLoanEntity>(
      BASE_URL,
      payload,
    );
    return data;
  },

  /**
   * Update an existing employee loan
   * Can modify amount, installments, dates, purpose, and notes
   * Note: Cannot modify approved/active loans in most cases
   *
   * @param id - Employee loan UUID
   * @param payload - Fields to update (partial update supported)
   * @returns Updated employee loan entity
   * @throws {404} If loan not found
   * @throws {400} If loan status doesn't allow updates
   */
  update: async (
    id: string,
    payload: UpdateEmployeeLoanDto,
  ): Promise<EmployeeLoanEntity> => {
    const { data } = await apiClient.patch<EmployeeLoanEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Delete an employee loan
   * Only pending loans can typically be deleted
   *
   * @param id - Employee loan UUID
   * @throws {404} If loan not found
   * @throws {400} If loan cannot be deleted (active/paid)
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
    filters: Partial<EmployeeLoanFiltersDto> = {},
  ): Promise<EmployeeLoanStatisticsResponse> => {
    const { data } = await apiClient.get<EmployeeLoanStatisticsResponse>(
      `${BASE_URL}/statistics`,
      {
        params: filters,
      },
    );
    return data;
  },

  /**
   * Approve an employee loan
   * Requires payroll:loans:approve permission
   * Changes status from PENDING to APPROVED
   * Must specify installment amount for confirmation
   *
   * @param id - Employee loan UUID
   * @param payload - Approval data with installment amount
   * @returns Approved employee loan entity
   * @throws {404} If loan not found
   * @throws {400} If loan already approved/rejected
   */
  approve: async (
    id: string,
    payload: ApproveEmployeeLoanDto,
  ): Promise<EmployeeLoanEntity> => {
    const { data } = await apiClient.post<EmployeeLoanEntity>(
      `${BASE_URL}/${id}/approve`,
      payload,
    );
    return data;
  },

  /**
   * Reject an employee loan
   * Requires payroll:loans:approve permission
   * Must provide a rejection reason for audit trail
   * Changes status from PENDING to REJECTED
   *
   * @param id - Employee loan UUID
   * @param payload - Rejection data with reason (required)
   * @returns Rejected employee loan entity
   * @throws {404} If loan not found
   * @throws {400} If loan already approved/rejected
   */
  reject: async (
    id: string,
    payload: RejectEmployeeLoanDto,
  ): Promise<EmployeeLoanEntity> => {
    const { data } = await apiClient.post<EmployeeLoanEntity>(
      `${BASE_URL}/${id}/reject`,
      payload,
    );
    return data;
  },

  /**
   * Pay a loan installment
   * Records a payment against an active loan
   * Automatically creates a LOAN_REPAYMENT deduction
   * Updates remainingAmount and paidInstallments count
   * Auto-changes status to PAID_OFF when loan is fully paid
   *
   * @param id - Employee loan UUID
   * @param payload - Payment data (amount, date, notes)
   * @returns Updated employee loan entity with new payment recorded
   * @throws {404} If loan not found
   * @throws {400} If loan is not active or payment amount invalid
   */
  payInstallment: async (
    id: string,
    payload: PayLoanInstallmentDto,
  ): Promise<EmployeeLoanEntity> => {
    const { data } = await apiClient.post<EmployeeLoanEntity>(
      `${BASE_URL}/${id}/pay`,
      {
        deductionDate: payload.deductionDate,
        notes: payload.notes,
        rowVersion: payload.rowVersion,
      },
    );
    return data;
  },
};
