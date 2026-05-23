/**
 * Audit Logs API Service
 * Handles audit trail and activity tracking requests
 */

import { apiClient } from "./axiosConfig";
import type {
  AuditLogsFiltersDto,
  AuditLogsResponseDto,
} from "@/types/audit.types";

const AUDIT_URL = "/reports/users/audit-logs";

export const auditApi = {
  /**
   * Get audit logs with filters
   */
  getAuditLogs: async (
    filters: AuditLogsFiltersDto = {},
  ): Promise<AuditLogsResponseDto> => {
    const { data } = await apiClient.get<AuditLogsResponseDto>(AUDIT_URL, {
      params: filters,
      paramsSerializer: {
        indexes: null, // This makes axios send arrays as: actions=CREATE&actions=LOGIN
      },
    });
    return data;
  },
};
