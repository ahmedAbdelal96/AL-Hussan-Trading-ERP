/**
 * Audit Logs Types
 * Types for audit trail and activity tracking
 */

export interface AuditLogDto {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  resourceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestUrl: string | null;
  status: AuditStatus;
  errorMessage: string | null;
  createdAt: string;
  // New fields for change tracking
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  changedFields?: string[];
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  VIEW = "VIEW",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  RESTORE = "RESTORE",
  ASSIGN_ROLE = "ASSIGN_ROLE",
  REVOKE_ROLE = "REVOKE_ROLE",
  GRANT_CUSTOM_PERMISSION = "GRANT_CUSTOM_PERMISSION",
  REVOKE_CUSTOM_PERMISSION = "REVOKE_CUSTOM_PERMISSION",
}

export enum AuditStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
  PARTIAL = "PARTIAL",
}

export interface AuditLogsFiltersDto {
  page?: number;
  limit?: number;
  userId?: string;
  action?: AuditAction; // Single action filter
  actions?: AuditAction[]; // Multiple actions filter
  resourceType?: string; // Changed from string[] to string
  status?: AuditStatus; // Backend expects single status
  startDate?: string;
  endDate?: string;
  search?: string;
  includeUserActivity?: boolean;
  includeActionDistribution?: boolean;
  includeResourceDistribution?: boolean;
  topUsersLimit?: number;
}

export interface AuditMetricsDto {
  totalLogs: number;
  successfulActions: number;
  failedActions: number;
  uniqueUsers: number;
  uniqueResources: number;
  averageResponseTime?: number;
}

export interface ActionDistributionDto {
  action: AuditAction;
  count: number;
  percentage: number;
}

export interface UserActivitySummaryDto {
  userId: string;
  email: string;
  name: string;
  actionCount: number;
  lastActivity: string;
}

export interface ResourceDistributionDto {
  resourceType: string;
  count: number;
  percentage: number;
}

export interface AuditLogsResponseDto {
  metrics: AuditMetricsDto;
  actionDistribution: ActionDistributionDto[];
  resourceDistribution: ResourceDistributionDto[];
  mostActiveUsers: UserActivitySummaryDto[];
  logs: AuditLogDto[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  generatedAt: Date;
}
