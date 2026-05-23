/**
 * ============================================================================
 * EMPLOYEES REPORTS - SWAGGER DECORATORS PART 3
 * ============================================================================
 *
 * Swagger/OpenAPI decorators for:
 * - Report 8: Employee Assignment
 * - Report 9: Contract Expiry
 *
 * @module EmployeesSwaggerPart3
 */

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

export function EmployeeAssignmentDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Employee Assignment Report',
      description:
        'Per-employee project deployment with allocation percentages and status (OVERHEAD, OVER_ALLOCATED, FULLY_ALLOCATED, UNDER_ALLOCATED)',
    }),
    ApiQuery({ name: 'allocationStatus', required: false }),
    ApiQuery({ name: 'sortBy', required: false }),
    ApiQuery({ name: 'sortOrder', required: false }),
    ApiQuery({ name: 'activeOnly', required: false }),
    ApiQuery({ name: 'department', required: false }),
    ApiQuery({ name: 'status', required: false }),
    ApiResponse({ status: 200, description: 'Employee assignment data' }),
  );
}

export function ContractExpiryDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Contract Expiry Report',
      description:
        'Employees with contracts expiring soon, classified by urgency (EXPIRED, CRITICAL, HIGH, MEDIUM, LOW). Only includes CONTRACT, FREELANCE, and PART_TIME employees.',
    }),
    ApiQuery({ name: 'daysAhead', required: false }),
    ApiQuery({ name: 'includeExpired', required: false }),
    ApiQuery({ name: 'urgency', required: false }),
    ApiQuery({ name: 'sortBy', required: false }),
    ApiQuery({ name: 'sortOrder', required: false }),
    ApiQuery({ name: 'department', required: false }),
    ApiResponse({ status: 200, description: 'Contract expiry data' }),
  );
}
