/**
 * Payslips API Service
 *
 * Handles all API calls related to payslip generation and management:
 * - Process monthly payroll
 * - Fetch payslips with filters
 * - Update payment status
 * - Get employee payslip history
 */

import { apiClient } from "./axiosConfig";
import type {
  ProcessPayrollDto,
  ProcessPayrollResponseDto,
  PayslipEntity,
  PayslipFiltersDto,
  PaginatedPayslipsDto,
  PayslipStatisticsDto,
  UpdatePayslipPaymentDto,
} from "@/types/payroll.types";

const BASE_URL = "/payroll";

/**
 * Process Monthly Payroll
 * Generates payslips for all active employees for the specified period
 *
 * @param data - Month, year, and optional employee IDs
 * @returns Process result with generated payslips and statistics
 */
export const processPayroll = async (
  data: ProcessPayrollDto,
): Promise<ProcessPayrollResponseDto> => {
  const response = await apiClient.post(`${BASE_URL}/process`, data);
  return response.data;
};

/**
 * Get All Payslips
 * Fetches paginated list of payslips with optional filtering
 *
 * @param filters - Filter criteria (employee, month, year, payment status, etc.)
 * @returns Paginated payslips with metadata
 */
export const getAllPayslips = async (
  filters?: PayslipFiltersDto,
): Promise<PaginatedPayslipsDto> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }

  const response = await apiClient.get(
    `${BASE_URL}/payslips?${params.toString()}`,
  );
  return response.data;
};

export const getPayslipStatistics = async (
  filters?: PayslipFiltersDto,
): Promise<PayslipStatisticsDto> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (
        key !== "page" &&
        key !== "limit" &&
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params.append(key, String(value));
      }
    });
  }

  const response = await apiClient.get(
    `${BASE_URL}/payslips/statistics?${params.toString()}`,
  );
  return response.data;
};

/**
 * Get Single Payslip
 * Fetches detailed information for a specific payslip
 *
 * @param id - Payslip UUID
 * @returns Full payslip entity with employee details
 */
export const getPayslip = async (id: string): Promise<PayslipEntity> => {
  const response = await apiClient.get(`${BASE_URL}/payslips/${id}`);
  return response.data;
};

/**
 * Get Employee Payslips
 * Fetches all payslips for a specific employee (salary history)
 *
 * @param employeeId - Employee UUID
 * @returns Array of payslips sorted by date descending
 */
export const getEmployeePayslips = async (
  employeeId: string,
): Promise<PayslipEntity[]> => {
  const response = await apiClient.get(
    `${BASE_URL}/employees/${employeeId}/payslips`,
  );
  return response.data;
};

/**
 * Update Payslip Payment Status
 * Marks a payslip as paid or unpaid with payment details
 *
 * @param id - Payslip UUID
 * @param data - Payment status and details (method, date, notes)
 * @returns Updated payslip entity
 */
export const updatePayslipPayment = async (
  id: string,
  data: UpdatePayslipPaymentDto,
): Promise<PayslipEntity> => {
  const response = await apiClient.patch(
    `${BASE_URL}/payslips/${id}/payment`,
    data,
  );
  return response.data;
};

/**
 * Export Payslip to PDF
 * Generates a printable PDF for a specific payslip
 *
 * @param id - Payslip UUID
 * @returns PDF blob for download
 */
export const exportPayslipToPdf = async (id: string): Promise<Blob> => {
  const response = await apiClient.get(
    `${BASE_URL}/payslips/${id}/export/pdf`,
    {
      responseType: "blob",
    },
  );
  return response.data;
};

/**
 * Export Multiple Payslips to Excel
 * Generates an Excel file for multiple payslips (bulk export)
 *
 * @param filters - Filter criteria for payslips to export
 * @returns Excel blob for download
 */
export const exportPayslipsToExcel = async (
  filters?: PayslipFiltersDto,
): Promise<Blob> => {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }

  const response = await apiClient.get(
    `${BASE_URL}/payslips/export/excel?${params.toString()}`,
    {
      responseType: "blob",
    },
  );
  return response.data;
};
