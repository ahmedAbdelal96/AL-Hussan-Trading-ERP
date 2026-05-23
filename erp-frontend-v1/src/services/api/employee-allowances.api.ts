/**
 * Employee Allowances API Service
 *
 * Manages employee-specific allowance assignments with approval workflow.
 * Each allowance has a frequency (daily, weekly, monthly, etc.) and can be
 * approved or rejected by management.
 *
 * Workflow: Create → Pending → Approve/Reject
 *
 * @module EmployeeAllowancesApi
 */

import { apiClient } from "./axiosConfig";
import type {
  EmployeeAllowanceEntity,
  CreateEmployeeAllowanceDto,
  UpdateEmployeeAllowanceDto,
  EmployeeAllowanceFiltersDto,
  EmployeeAllowanceListResponse,
  EmployeeAllowanceStatisticsResponse,
  ApproveEmployeeAllowanceDto,
  RejectEmployeeAllowanceDto,
} from "@/types/payroll.types";

const BASE_URL = "/payroll/allowances";

/**
 * Employee Allowances API Service
 * Provides CRUD operations and approval workflow for employee allowances
 */
export const employeeAllowancesApi = {
  /**
   * Get all employee allowances with optional filters
   * Supports filtering by employee, allowance type, frequency, and approval status
   *
   * @param filters - Query parameters for filtering and pagination
   * @returns Paginated list of employee allowances
   */
  getAll: async (
    filters: Partial<EmployeeAllowanceFiltersDto> = {},
  ): Promise<EmployeeAllowanceListResponse> => {
    const { data } = await apiClient.get<EmployeeAllowanceListResponse>(
      BASE_URL,
      {
        params: filters,
      },
    );
    return data;
  },

  /**
   * Get allowances for a specific employee
   * Useful for employee detail pages and payroll calculations
   *
   * @param employeeId - Employee UUID
   * @returns Array of employee allowances
   */
  getByEmployee: async (
    employeeId: string,
  ): Promise<EmployeeAllowanceEntity[]> => {
    const { data } = await apiClient.get<EmployeeAllowanceEntity[]>(
      `${BASE_URL}/employee/${employeeId}`,
    );
    return data;
  },

  /**
   * Get a single employee allowance by ID
   *
   * @param id - Employee allowance UUID
   * @returns Employee allowance entity with allowance type relation
   * @throws {404} If allowance not found
   */
  getById: async (id: string): Promise<EmployeeAllowanceEntity> => {
    const { data } = await apiClient.get<EmployeeAllowanceEntity>(
      `${BASE_URL}/${id}`,
    );
    return data;
  },

  /**
   * Create a new employee allowance
   * Initial status will be PENDING, awaiting approval
   *
   * @param payload - Employee allowance creation data
   * @returns Created employee allowance entity
   * @throws {400} If validation fails
   */
  create: async (
    payload: CreateEmployeeAllowanceDto,
  ): Promise<EmployeeAllowanceEntity> => {
    const { data } = await apiClient.post<EmployeeAllowanceEntity>(
      BASE_URL,
      payload,
    );
    return data;
  },

  /**
   * Update an existing employee allowance
   * Can modify amount, frequency, effective dates, and notes
   * Note: Approved allowances may require re-approval after modification
   *
   * @param id - Employee allowance UUID
   * @param payload - Fields to update (partial update supported)
   * @returns Updated employee allowance entity
   * @throws {404} If allowance not found
   */
  update: async (
    id: string,
    payload: UpdateEmployeeAllowanceDto,
  ): Promise<EmployeeAllowanceEntity> => {
    const { data } = await apiClient.patch<EmployeeAllowanceEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Delete an employee allowance
   *
   * @param id - Employee allowance UUID
   * @throws {404} If allowance not found
   * @throws {403} If user lacks permission
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
    filters: Partial<EmployeeAllowanceFiltersDto> = {},
  ): Promise<EmployeeAllowanceStatisticsResponse> => {
    const { data } = await apiClient.get<EmployeeAllowanceStatisticsResponse>(
      `${BASE_URL}/statistics`,
      {
        params: filters,
      },
    );
    return data;
  },

  /**
   * Approve an employee allowance
   * Requires payroll:allowances:approve permission
   * Once approved, the allowance becomes active and included in payroll
   *
   * @param id - Employee allowance UUID
   * @param payload - Approval data (optional notes)
   * @returns Approved employee allowance entity
   * @throws {404} If allowance not found
   * @throws {400} If allowance already approved/rejected
   */
  approve: async (
    id: string,
    payload: ApproveEmployeeAllowanceDto,
  ): Promise<EmployeeAllowanceEntity> => {
    const { data } = await apiClient.post<EmployeeAllowanceEntity>(
      `${BASE_URL}/${id}/approve`,
      payload,
    );
    return data;
  },

  /**
   * Reject an employee allowance
   * Requires payroll:allowances:approve permission
   * Must provide a rejection reason for audit trail
   *
   * @param id - Employee allowance UUID
   * @param payload - Rejection data with reason (required)
   * @returns Rejected employee allowance entity
   * @throws {404} If allowance not found
   * @throws {400} If allowance already approved/rejected
   */
  reject: async (
    id: string,
    payload: RejectEmployeeAllowanceDto,
  ): Promise<EmployeeAllowanceEntity> => {
    const { data } = await apiClient.post<EmployeeAllowanceEntity>(
      `${BASE_URL}/${id}/reject`,
      payload,
    );
    return data;
  },

  /**
   * Restore a soft-deleted employee allowance
   * Only accessible to SUPERADMIN
   *
   * @param id - Employee allowance UUID
   * @returns Restored employee allowance entity
   * @throws {404} If allowance not found
   * @throws {400} If allowance is not deleted
   */
  restore: async (id: string): Promise<EmployeeAllowanceEntity> => {
    const { data } = await apiClient.post<EmployeeAllowanceEntity>(
      `${BASE_URL}/${id}/restore`,
    );
    return data;
  },

  /**
   * Get all soft-deleted employee allowances
   * Only accessible to SUPERADMIN
   *
   * @param filters - Query parameters for filtering and pagination
   * @returns Paginated list of deleted employee allowances
   */
  listDeleted: async (
    filters?: Partial<EmployeeAllowanceFiltersDto>,
  ): Promise<EmployeeAllowanceListResponse> => {
    const { data } = await apiClient.get<EmployeeAllowanceListResponse>(
      `${BASE_URL}/deleted`,
      {
        params: filters,
      },
    );
    return data;
  },
};
