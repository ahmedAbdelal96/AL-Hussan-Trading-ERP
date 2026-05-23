/**
 * Payslips React Query Hooks
 *
 * Custom hooks for managing payslip data with React Query:
 * - Automatic caching
 * - Background refetching
 * - Optimistic updates
 * - Error handling
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import {
  processPayroll,
  getAllPayslips,
  getPayslipStatistics,
  getPayslip,
  getEmployeePayslips,
  updatePayslipPayment,
  exportPayslipToPdf,
  exportPayslipsToExcel,
} from "@/services/api/payslips.api";
import type {
  ProcessPayrollDto,
  PayslipFiltersDto,
  UpdatePayslipPaymentDto,
} from "@/types/payroll.types";

// Query keys for caching
export const payslipsKeys = {
  all: ["payslips"] as const,
  lists: () => [...payslipsKeys.all, "list"] as const,
  list: (filters: PayslipFiltersDto) =>
    [...payslipsKeys.lists(), filters] as const,
  statistics: (filters: PayslipFiltersDto = {}) =>
    [...payslipsKeys.all, "statistics", filters] as const,
  details: () => [...payslipsKeys.all, "detail"] as const,
  detail: (id: string) => [...payslipsKeys.details(), id] as const,
  employee: (employeeId: string) =>
    [...payslipsKeys.all, "employee", employeeId] as const,
};

/**
 * Hook: Use Payslips (List with Filters)
 * Fetches paginated payslips with optional filtering
 *
 * @param filters - Filter criteria
 * @returns Query result with payslips data
 */
export function usePayslips(filters: PayslipFiltersDto = {}) {
  return useQuery({
    queryKey: payslipsKeys.list(filters),
    queryFn: () => {
      return getAllPayslips(filters);
    },
    staleTime: 30000, // 30 seconds
  });
}

export function usePayslipStatistics(filters: PayslipFiltersDto = {}) {
  const statsFilters: PayslipFiltersDto = { ...filters };
  delete statsFilters.page;
  delete statsFilters.limit;
  return useQuery({
    queryKey: payslipsKeys.statistics(statsFilters),
    queryFn: () => getPayslipStatistics(statsFilters),
    staleTime: 30000,
  });
}

/**
 * Hook: Use Payslip (Single)
 * Fetches a single payslip by ID
 *
 * @param id - Payslip UUID
 * @returns Query result with payslip details
 */
export function usePayslip(id: string) {
  return useQuery({
    queryKey: payslipsKeys.detail(id),
    queryFn: () => getPayslip(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook: Use Employee Payslips
 * Fetches all payslips for a specific employee (salary history)
 *
 * @param employeeId - Employee UUID
 * @returns Query result with employee payslips
 */
export function useEmployeePayslips(employeeId: string) {
  return useQuery({
    queryKey: payslipsKeys.employee(employeeId),
    queryFn: () => getEmployeePayslips(employeeId),
    enabled: !!employeeId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook: Process Payroll (Mutation)
 * Generates payslips for a specific period
 *
 * @returns Mutation object with process function
 */
export function useProcessPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProcessPayrollDto) => processPayroll(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: payslipsKeys.lists() });
      showToast.success(
        `تم معالجة الرواتب بنجاح: ${data.successful} موظف - إجمالي الرواتب: ${data.totalNetSalary.toLocaleString()} ر.س`,
      );

      // Show errors if any
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((error) => {
          showToast.error(`خطأ: ${error.employeeName} - ${error.error}`);
        });
      }
    },
    onError: (error: Error) => {
      const apiError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast.error(
        apiError.response?.data?.message ||
          apiError.message ||
          "فشل في معالجة الرواتب",
      );
    },
  });
}

/**
 * Hook: Update Payment Status (Mutation)
 * Marks a payslip as paid or unpaid
 *
 * @returns Mutation object with update function
 */
export function useUpdatePayslipPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePayslipPaymentDto }) =>
      updatePayslipPayment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: payslipsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: payslipsKeys.detail(variables.id),
      });
      showToast.success(
        variables.data.isPaid
          ? "تم تحديث حالة الدفع إلى مدفوع"
          : "تم تحديث حالة الدفع إلى غير مدفوع",
      );
    },
    onError: (error: Error) => {
      const apiError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast.error(
        apiError.response?.data?.message ||
          apiError.message ||
          "فشل في تحديث حالة الدفع",
      );
    },
  });
}

/**
 * Hook: Export Payslip to PDF
 * Downloads a single payslip as PDF
 *
 * @returns Mutation object with export function
 */
export function useExportPayslipPdf() {
  return useMutation({
    mutationFn: (id: string) => exportPayslipToPdf(id),
    onSuccess: (blob, id) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast.success("تم تنزيل كشف الراتب بنجاح");
    },
    onError: (error: Error) => {
      const apiError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast.error(
        apiError.response?.data?.message ||
          apiError.message ||
          "فشل في تنزيل كشف الراتب",
      );
    },
  });
}

/**
 * Hook: Export Payslips to Excel
 * Downloads multiple payslips as Excel file
 *
 * @returns Mutation object with export function
 */
export function useExportPayslipsExcel() {
  return useMutation({
    mutationFn: (filters?: PayslipFiltersDto) => exportPayslipsToExcel(filters),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslips-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast.success("تم تنزيل كشوف الرواتب بنجاح");
    },
    onError: (error: Error) => {
      const apiError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast.error(
        apiError.response?.data?.message ||
          apiError.message ||
          "فشل في تنزيل كشوف الرواتب",
      );
    },
  });
}
