/**
 * ============================================================================
 * @AuditLog DECORATOR - AUDIT LOGGING CONFIGURATION
 * ============================================================================
 *
 * Controls audit logging behavior for specific endpoints.
 * Works with AuditInterceptor to customize what gets logged.
 *
 * @example
 * // Enable audit logging with custom resource type
 * @AuditLog({ resourceType: 'employee', action: 'CREATE' })
 * @Post()
 * createEmployee() { ... }
 *
 * @example
 * // Disable audit logging for specific endpoint
 * @AuditLog({ enabled: false })
 * @Get('health')
 * healthCheck() { ... }
 *
 * @example
 * // Log with custom metadata
 * @AuditLog({
 *   resourceType: 'payroll',
 *   captureRequest: true,
 *   captureResponse: false
 * })
 * @Post('process')
 * processPayroll() { ... }
 *
 * ============================================================================
 */

import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

export interface AuditLogOptions {
  /**
   * Enable/disable audit logging for this endpoint
   * @default true
   */
  enabled?: boolean;

  /**
   * Resource type (employee, payroll, user, etc.)
   * If not provided, will be extracted from controller/endpoint
   */
  resourceType?: string;

  /**
   * Action type (CREATE, UPDATE, DELETE, VIEW, etc.)
   * If not provided, will be inferred from HTTP method
   */
  action?: AuditAction;

  /**
   * Capture request body in audit log
   * @default true for POST/PUT/PATCH, false for GET/DELETE
   */
  captureRequest?: boolean;

  /**
   * Capture response data in audit log
   * @default false (for privacy and performance)
   */
  captureResponse?: boolean;

  /**
   * Capture changed fields for UPDATE operations
   * Requires old and new values comparison
   * @default true for UPDATE
   */
  captureChanges?: boolean;

  /**
   * Description for this operation
   */
  description?: string;
}

export const AUDIT_LOG_METADATA_KEY = 'audit:log';

/**
 * Decorator to configure audit logging for an endpoint
 */
export const AuditLog = (options: AuditLogOptions = {}) => {
  return SetMetadata(AUDIT_LOG_METADATA_KEY, {
    enabled: options.enabled !== false, // default true
    resourceType: options.resourceType,
    action: options.action,
    captureRequest: options.captureRequest,
    captureResponse: options.captureResponse ?? false,
    captureChanges: options.captureChanges,
    description: options.description,
  });
};

/**
 * Decorator to exclude endpoint from audit logging
 */
export const NoAuditLog = () => {
  return AuditLog({ enabled: false });
};
