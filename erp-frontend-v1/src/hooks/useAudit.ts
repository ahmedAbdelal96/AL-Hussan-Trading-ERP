/**
 * Audit Logs Custom Hooks
 * React Query hooks for audit trail and activity tracking
 */

import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/services/api/audit.api";
import type { AuditLogsFiltersDto } from "@/types/audit.types";

// Query Keys
export const AUDIT_KEYS = {
  all: ["audit"] as const,
  logs: (filters?: AuditLogsFiltersDto) =>
    [...AUDIT_KEYS.all, "logs", filters] as const,
};

/**
 * Get Audit Logs Hook
 * Fetches audit logs with filters, metrics, and statistics
 */
export const useAuditLogs = (filters: AuditLogsFiltersDto = {}) => {
  return useQuery({
    queryKey: AUDIT_KEYS.logs(filters),
    queryFn: () => auditApi.getAuditLogs(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
};
