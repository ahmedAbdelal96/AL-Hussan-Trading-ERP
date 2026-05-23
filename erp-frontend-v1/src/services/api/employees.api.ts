/**
 * Employees API Service
 * Handles all HTTP requests to the employees endpoints
 */

import { apiClient } from "./axiosConfig";
import type {
  EmployeeEntity,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeFiltersDto,
  PaginatedEmployeesResponse,
  BulkCreateEmployeesDto,
  UpdateSalaryDto,
  UpdateSalaryResponseDto,
  SalaryHistoryEntity,
  RehireEmployeeDto,
} from "@/types/employees.types";
import type {
  EmployeesStatistics,
  EmployeesStatisticsParams,
} from "@/types/employees-statistics";

const BASE_URL = "/employees";
const PAYROLL_EMPLOYEES_BASE_URL = "/payroll/employees";
type EmployeeDocumentRecord = {
  id: string;
  documentType: string;
  documentName: string;
  issueDate: string | null;
  expiryDate: string | null;
  notes?: string;
} & Record<string, unknown>;

export const employeesApi = {
  /**
   * Get all employees with filters and pagination
   * @param filters - Filter and pagination options
   * @returns Paginated list of employees
   */
  getAll: async (
    filters: Partial<EmployeeFiltersDto> = {},
  ): Promise<PaginatedEmployeesResponse> => {
    const response = await apiClient.get<PaginatedEmployeesResponse>(BASE_URL, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get single employee by ID
   * @param id - Employee UUID
   * @returns Employee details
   */
  getById: async (id: string): Promise<EmployeeEntity> => {
    const response = await apiClient.get<EmployeeEntity>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Create new employee
   * @param payload - Employee data
   * @returns Created employee
   */
  create: async (payload: CreateEmployeeDto): Promise<EmployeeEntity> => {
    const response = await apiClient.post<EmployeeEntity>(BASE_URL, payload);
    return response.data;
  },

  /**
   * Bulk create multiple employees
   * @param payload - Array of employees to create
   * @returns Array of created employees
   */
  bulkCreate: async (
    payload: BulkCreateEmployeesDto,
  ): Promise<EmployeeEntity[]> => {
    const response = await apiClient.post<EmployeeEntity[]>(
      `${BASE_URL}/bulk`,
      payload,
    );
    return response.data;
  },

  /**
   * Update existing employee
   * @param id - Employee UUID
   * @param payload - Updated employee data
   * @returns Updated employee
   */
  update: async (
    id: string,
    payload: UpdateEmployeeDto,
  ): Promise<EmployeeEntity> => {
    const response = await apiClient.put<EmployeeEntity>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return response.data;
  },

  /**
   * Delete employee (soft delete)
   * @param id - Employee UUID
   */
  delete: async (
    id: string,
    options?: { rowVersion?: number },
  ): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`, {
      data: options?.rowVersion ? { rowVersion: options.rowVersion } : undefined,
    });
  },

  /**
   * Rehire a terminated employee
   * @param id - Employee UUID
   * @param payload - Rehire data
   * @returns Updated employee
   */
  rehire: async (
    id: string,
    payload: RehireEmployeeDto,
  ): Promise<EmployeeEntity> => {
    const response = await apiClient.post<EmployeeEntity>(
      `${BASE_URL}/${id}/rehire`,
      payload,
    );
    return response.data;
  },

  /**
   * Profile Picture API
   */
  profilePicture: {
    /**
     * Upload employee profile picture
     * @param id - Employee UUID
     * @param file - Image file
     * @returns Success message with profile picture URL
     */
    upload: async (
      id: string,
      file: File,
    ): Promise<{ message: string; profilePicture: string }> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post<{
        message: string;
        profilePicture: string;
      }>(`${BASE_URL}/${id}/profile-picture`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },

    /**
     * Delete employee profile picture
     * @param id - Employee UUID
     */
    delete: async (id: string): Promise<{ message: string }> => {
      const response = await apiClient.delete<{ message: string }>(
        `${BASE_URL}/${id}/profile-picture`,
      );
      return response.data;
    },
  },

  /**
   * Documents API
   */
  documents: {
    /**
     * Upload documents for an employee
     * @param id - Employee UUID
     * @param files - Array of files to upload
     * @param metadata - Document metadata
     * @returns Array of uploaded documents
     */
    upload: async (
      id: string,
      files: File[],
      metadata: {
        documentType: string;
        documentName: string;
        issueDate?: string;
        expiryDate?: string;
        notes?: string;
      },
    ): Promise<EmployeeDocumentRecord[]> => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("documentType", metadata.documentType);
      formData.append("documentName", metadata.documentName);
      if (metadata.issueDate) formData.append("issueDate", metadata.issueDate);
      if (metadata.expiryDate)
        formData.append("expiryDate", metadata.expiryDate);
      if (metadata.notes) formData.append("notes", metadata.notes);

      const response = await apiClient.post<EmployeeDocumentRecord[]>(
        `${BASE_URL}/${id}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data;
    },

    /**
     * Get all documents for an employee
     * @param id - Employee UUID
     * @returns Array of documents
     */
    getAll: async (id: string): Promise<EmployeeDocumentRecord[]> => {
      const response = await apiClient.get<EmployeeDocumentRecord[]>(
        `${BASE_URL}/${id}/documents`,
      );
      return response.data;
    },

    /**
     * Delete a document
     * @param employeeId - Employee UUID
     * @param documentId - Document ID
     */
    delete: async (
      employeeId: string,
      documentId: string,
    ): Promise<{ message: string }> => {
      const response = await apiClient.delete<{ message: string }>(
        `${BASE_URL}/${employeeId}/documents/${documentId}`,
      );
      return response.data;
    },

    /**
     * Download a document
     * @param employeeId - Employee UUID
     * @param documentId - Document ID
     * @returns File blob
     */
    download: async (employeeId: string, documentId: string): Promise<Blob> => {
      const response = await apiClient.get(
        `${BASE_URL}/${employeeId}/documents/${documentId}/download`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    },
  },

  /**
   * Statistics API
   */
  statistics: {
    /**
     * Get comprehensive employee statistics
     * @param params - Optional filters for statistics
     * @returns Employee statistics and analytics
     */
    getEmployeesStatistics: async (
      params?: EmployeesStatisticsParams,
    ): Promise<EmployeesStatistics> => {
      const response = await apiClient.get<EmployeesStatistics>(
        `${BASE_URL}/statistics`,
        { params },
      );
      return response.data;
    },
  },

  // Legacy methods - keeping for backward compatibility
  /**
   * @deprecated Use documents.upload instead
   */
  uploadDocuments: async (
    id: string,
    documents: Array<{
      name: string;
      type: string;
      size: number;
      dataUrl?: string;
    }>,
  ): Promise<{ success: boolean; message: string }> => {
    // Store in localStorage for now (temporary solution)
    const existingDocs = JSON.parse(
      localStorage.getItem(`employee_${id}_documents`) || "[]",
    );

    const newDocs = documents.map((doc) => ({
      id: `doc-${Date.now()}-${Math.random()}`,
      ...doc,
      uploadedAt: new Date().toISOString(),
    }));

    localStorage.setItem(
      `employee_${id}_documents`,
      JSON.stringify([...existingDocs, ...newDocs]),
    );

    return {
      success: true,
      message: `${documents.length} document(s) uploaded successfully`,
    };
  },

  /**
   * @deprecated Use documents.getAll instead
   */
  getDocuments: async (
    id: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      dataUrl?: string;
      uploadedAt: string;
    }>
  > => {
    const docs = JSON.parse(
      localStorage.getItem(`employee_${id}_documents`) || "[]",
    );
    return docs;
  },

  /**
   * @deprecated Use documents.delete instead
   */
  deleteDocument: async (
    employeeId: string,
    documentId: string,
  ): Promise<void> => {
    const docs = JSON.parse(
      localStorage.getItem(`employee_${employeeId}_documents`) || "[]",
    ) as EmployeeDocumentRecord[];
    const filtered = docs.filter((doc) => doc.id !== documentId);
    localStorage.setItem(
      `employee_${employeeId}_documents`,
      JSON.stringify(filtered),
    );
  },
};

/**
 * Salary Management API
 * Handles all salary-related operations including updates and history retrieval
 *
 * Architecture:
 * - Uses optimistic locking (version field) to prevent concurrent update conflicts
 * - Dedicated endpoint for salary updates (separate from employee profile updates)
 * - Follows single responsibility principle
 * - Immutable salary history for audit trail
 *
 * Error Handling:
 * - 404: Employee not found
 * - 409: Version mismatch (concurrent update detected) - requires refresh and retry
 * - 400: Invalid salary (must be > 0) or unchanged salary value
 */
export const salarytApi = {
  /**
   * Update an employee's salary with optimistic locking
   *
   * Endpoint: PATCH /api/v1/payroll/employees/:employeeId/salary
   *
   * Optimistic Locking Mechanism:
   * 1. Frontend reads current version: employee.version
   * 2. User updates salary and submits form
   * 4. Backend flow:
   *    - Acquires row-level lock: SELECT ... FOR UPDATE
   *    - Verifies: if employee.version !== dto.version → throw ConflictException (409)
   *    - Validates: baseSalary > 0 and baseSalary !== current salary
   *    - Creates SalaryHistory record with BEFORE and AFTER values
   *    - Updates employee: baseSalary, version++, lastSalaryUpdate
   *    - Returns updated employee with new version
   * 5. Frontend gets new employee with version++
   * 6. On 409 response:
   *    - Another user modified employee salary concurrently
   *    - Frontend must: Show alert, refetch employee, reset form with new version
   *
   * Use Cases:
   * - HR Manager: Update salary in employee profile or payroll module
   * - Bulk salary update: Via bulk operation endpoint (different endpoint)
   * - Employee profile update: If included in employee update DTO
   *
   * @param employeeId - UUID of the employee to update
   * @param payload - Salary update data with version field for optimistic locking
   * @returns Updated employee with new version and salary details
   *
   * @throws {NotFoundException} - Employee doesn't exist
   * @throws {ConflictException} - Version mismatch (concurrent update detected) - 409 status
   * @throws {BadRequestException} - Invalid salary or unchanged salary value
   *
   * @example
   * ```typescript
   * // Get current version from employee
   * const employee = await getEmployee(employeeId);
   *
   * // Update salary
   * const updated = await salaryApi.updateSalary(employeeId, {
   *   baseSalary: 7000,
   *   currency: "SAR",
   *   reason: "Annual performance raise",
   *   version: employee.version // REQUIRED: Current version for optimistic lock
   * });
   *
   * // Frontend now has: updated.version (incremented by backend)
   * // Next update will send version: updated.version
   *
   * // Handle 409 Conflict (concurrent update)
   * try {
   *   await salaryApi.updateSalary(employeeId, updatePayload);
   * } catch (error) {
   *     // Another user updated the salary
   *     const latest = await employeesApi.getById(employeeId);
   *     // Show dialog: "Data changed, please refresh and try again"
   *     // Use latest.version for next attempt
   *   }
   * }
   * ```
   */
  updateSalary: async (
    employeeId: string,
    payload: UpdateSalaryDto,
  ): Promise<EmployeeEntity> => {
    const response = await apiClient.patch<EmployeeEntity>(
      `${PAYROLL_EMPLOYEES_BASE_URL}/${employeeId}/salary`,
      payload,
    );
    return response.data;
  },

  /**
   * Get salary history for an employee
   *
   * Endpoint: GET /api/v1/payroll/employees/:employeeId/salary-history
   *
   * Returns immutable audit trail of all salary changes for an employee
   * Sorted by date descending (most recent first)
   *
   * Data Returned:
   * - baseSalaryBefore: Salary before the change
   * - baseSalaryAfter: Salary after the change
   * - changeAmount: Calculated as (After - Before)
   * - changePercentage: ((After - Before) / Before) * 100
   * - isRaise: true if changeAmount > 0, false otherwise
   * - reason: HR-provided reason for change
   * - source: Origin of change (MANUAL, EMPLOYEE_UPDATE, BULK_UPDATE, MIGRATION)
   * - changedBy: User ID who made the change
   * - changedAt: When the change was made
   *
   * Use Cases:
   * - Salary history timeline on employee profile
   * - Salary change analysis and reporting
   * - Audit trail for compliance
   * - Calculate average raise percentage
   *
   * @param employeeId - UUID of the employee
   * @param page - Page number for pagination (default: 1)
   * @param pageSize - Items per page (default: 20)
   * @returns Array of salary history records (most recent first)
   *
   * @example
   * ```typescript
   * // Get recent salary history
   * const history = await salaryApi.getSalaryHistory(employeeId, 1, 10);
   *
   * // Calculate last raise
   * const lastRaise = history.find(h => h.isRaise);
   * if (lastRaise) {
   *   console.log(`Last raise: ${lastRaise.changePercentage}% on ${lastRaise.changedAt}`);
   * }
   *
   * // Find all manual salary changes (HR adjustments)
   * const manualChanges = history.filter(h => h.source === 'MANUAL');
   * ```
   */
  getSalaryHistory: async (
    employeeId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    data: SalaryHistoryEntity[];
    meta: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }> => {
    const response = await apiClient.get<{
      data: SalaryHistoryEntity[];
      meta: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
      };
    }>(`${PAYROLL_EMPLOYEES_BASE_URL}/${employeeId}/salary-history`, {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get salary statistics for an employee
   *
   * Endpoint: GET /api/v1/payroll/employees/:employeeId/salary-stats
   *
   * Provides analytical data about salary changes over time
   * Useful for dashboards and reports
   *
   * Data Returned:
   * - currentSalary: Current base salary
   * - currency: Currency code
   * - totalRaises: Number of salary increases
   * - totalReductions: Number of salary decreases
   * - averageRaisePercentage: Average increase percentage
   * - largestRaise: Largest single raise amount
   * - totalIncreaseAmount: Sum of all increases
   * - totalDecreaseAmount: Sum of all decreases
   * - lastRaiseDate: Date of most recent raise
   * - dayssinceLastRaise: Days since last salary increase
   * - yearOverYearGrowth: Year-over-year percentage growth
   *
   * Use Cases:
   * - Employee salary insights card
   * - HR analytics dashboard
   * - Compensation planning
   * - Performance analysis
   *
   * @param employeeId - UUID of the employee
   * @returns Salary statistics object
   *
   * @example
   * ```typescript
   * const stats = await salaryApi.getSalaryStats(employeeId);
   * console.log(`${stats.averageRaisePercentage}% average raise`);
   * console.log(`${stats.daysSinceLastRaise} days since last raise`);
   * ```
   */
  getSalaryStats: async (
    employeeId: string,
  ): Promise<{
    currentSalary: number;
    currency: string;
    totalRaises: number;
    totalReductions: number;
    averageRaisePercentage: number;
    largestRaise: number;
    totalIncreaseAmount: number;
    totalDecreaseAmount: number;
    lastRaiseDate: string | null;
    daysSinceLastRaise: number | null;
    yearOverYearGrowth: number;
  }> => {
    const response = await apiClient.get<{
      currentSalary: number;
      currency: string;
      totalRaises: number;
      totalReductions: number;
      averageRaisePercentage: number;
      largestRaise: number;
      totalIncreaseAmount: number;
      totalDecreaseAmount: number;
      lastRaiseDate: string | null;
      daysSinceLastRaise: number | null;
      yearOverYearGrowth: number;
    }>(`${PAYROLL_EMPLOYEES_BASE_URL}/${employeeId}/salary-stats`);
    return response.data;
  },
};

// Canonical alias; keeps backward compatibility with existing imports.
export const salaryApi = salarytApi;
