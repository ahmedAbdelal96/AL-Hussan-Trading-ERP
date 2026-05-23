/**
 * Payroll Processing Hooks
 *
 * React Query hooks for payroll preview and processing.
 * - usePreviewPayroll: Preview salary calculations without saving
 * - useProcessPayroll: Process and save payslips
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import {
  payrollProcessingApi,
  type PreviewPayrollResponse,
  type ProcessPayrollResponse,
} from "@/services/api/payroll.api";
import { payslipsKeys } from "@/hooks/usePayslips";

export const PAYROLL_PROCESSING_KEYS = {
  all: ["payroll-processing"] as const,
};

/**
 * Preview payroll for a specific month/year
 * Calls POST /payroll/preview - calculates salaries without saving
 */
export const usePreviewPayroll = () => {
  return useMutation<
    PreviewPayrollResponse,
    Error & { response?: { data?: { message?: string } } },
    { month: number; year: number }
  >({
    mutationFn: async ({ month, year }) => {
      return payrollProcessingApi.previewPayroll({
        payPeriodMonth: month,
        payPeriodYear: year,
      });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "حدث خطأ أثناء معاينة الرواتب";
      showToast.error(message);
    },
  });
};

/**
 * Process payroll - create payslips and record loan payments
 * Calls POST /payroll/process
 */
export const useProcessPayroll = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ProcessPayrollResponse,
    Error & { response?: { data?: { message?: string } } },
    { month: number; year: number; notes?: string }
  >({
    mutationFn: async ({ month, year, notes }) => {
      return payrollProcessingApi.processPayroll({
        payPeriodMonth: month,
        payPeriodYear: year,
        notes,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: PAYROLL_PROCESSING_KEYS.all,
      });
      queryClient.invalidateQueries({ queryKey: payslipsKeys.lists() });
      showToast.success(
        `تمت معالجة الرواتب بنجاح (${result.successful}/${result.totalProcessed})`,
      );
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "حدث خطأ أثناء معالجة الرواتب";
      showToast.error(message);
    },
  });
};
