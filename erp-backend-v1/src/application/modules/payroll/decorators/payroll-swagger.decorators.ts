import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import {
  ApproveEmployeeAllowanceDto,
  RejectEmployeeAllowanceDto,
} from '../dto';

// ============================================================================
// ALLOWANCE TYPE SWAGGER DECORATORS
// ============================================================================

export function SwaggerCreateAllowanceType() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new allowance type' }),
    ApiResponse({
      status: 201,
      description: 'Allowance type created successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - allowance type name already exists',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllAllowanceTypes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all allowance types with filtering and pagination',
    }),
    ApiQuery({
      name: 'isActive',
      required: false,
      description: 'Filter by active status',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by name or description',
    }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Items per page' }),
    ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order (asc or desc)',
    }),
    ApiResponse({
      status: 200,
      description: 'Allowance types retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllowanceType() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single allowance type by ID' }),
    ApiParam({ name: 'id', description: 'Allowance type UUID' }),
    ApiResponse({
      status: 200,
      description: 'Allowance type retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Allowance type not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateAllowanceType() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an allowance type' }),
    ApiParam({ name: 'id', description: 'Allowance type UUID' }),
    ApiResponse({
      status: 200,
      description: 'Allowance type updated successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Allowance type not found' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - allowance type name already exists',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteAllowanceType() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an allowance type' }),
    ApiParam({ name: 'id', description: 'Allowance type UUID' }),
    ApiResponse({
      status: 200,
      description: 'Allowance type deleted successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Allowance type not found' }),
    ApiResponse({
      status: 409,
      description:
        'Conflict - allowance type has associated employee allowances',
    }),
    ApiBearerAuth(),
  );
}

// ============================================================================
// EMPLOYEE ALLOWANCE SWAGGER DECORATORS
// ============================================================================

export function SwaggerCreateEmployeeAllowance() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new employee allowance' }),
    ApiResponse({
      status: 201,
      description: 'Employee allowance created successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({
      status: 404,
      description: 'Employee or allowance type not found',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - duplicate allowance for employee',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllEmployeeAllowances() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all employee allowances with filtering and pagination',
    }),
    ApiQuery({
      name: 'employeeId',
      required: false,
      description: 'Filter by employee ID',
    }),
    ApiQuery({
      name: 'allowanceTypeId',
      required: false,
      description: 'Filter by allowance type ID',
    }),
    ApiQuery({
      name: 'frequency',
      required: false,
      description: 'Filter by frequency (monthly, quarterly, annual)',
    }),
    ApiQuery({
      name: 'isActive',
      required: false,
      description: 'Filter by active status',
    }),
    ApiQuery({
      name: 'isApproved',
      required: false,
      description: 'Filter by approval status',
    }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Items per page' }),
    ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order (asc or desc)',
    }),
    ApiResponse({
      status: 200,
      description: 'Employee allowances retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetEmployeeAllowance() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single employee allowance by ID' }),
    ApiParam({ name: 'id', description: 'Employee allowance UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee allowance retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee allowance not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateEmployeeAllowance() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an employee allowance' }),
    ApiParam({ name: 'id', description: 'Employee allowance UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee allowance updated successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee allowance not found' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - cannot update approved allowance',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteEmployeeAllowance() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an employee allowance' }),
    ApiParam({ name: 'id', description: 'Employee allowance UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee allowance deleted successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee allowance not found' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - cannot delete approved allowance',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerApproveEmployeeAllowance() {
  return applyDecorators(
    ApiOperation({ summary: 'Approve a pending employee allowance' }),
    ApiParam({ name: 'id', description: 'Employee allowance UUID' }),
    ApiBody({
      type: ApproveEmployeeAllowanceDto,
      description:
        'Optional approval notes + expected rowVersion for optimistic concurrency',
    }),
    ApiResponse({
      status: 200,
      description: 'Employee allowance approved successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - only pending allowances can be approved',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee allowance not found' }),
    ApiResponse({
      status: 409,
      description:
        'Conflict - allowance was modified by another user (row version mismatch)',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerRejectEmployeeAllowance() {
  return applyDecorators(
    ApiOperation({ summary: 'Reject a pending employee allowance' }),
    ApiParam({ name: 'id', description: 'Employee allowance UUID' }),
    ApiBody({
      type: RejectEmployeeAllowanceDto,
      description:
        'Rejection reason + optional expected rowVersion for optimistic concurrency',
    }),
    ApiResponse({
      status: 200,
      description: 'Employee allowance rejected successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - only pending allowances can be rejected',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee allowance not found' }),
    ApiResponse({
      status: 409,
      description:
        'Conflict - allowance was modified by another user (row version mismatch)',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetEmployeeActiveAllowances() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all active allowances for a specific employee',
    }),
    ApiParam({ name: 'employeeId', description: 'Employee UUID' }),
    ApiResponse({
      status: 200,
      description: 'Active employee allowances retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
    ApiBearerAuth(),
  );
}

// ============================================================================
// EMPLOYEE LOAN SWAGGER DECORATORS
// ============================================================================

export function SwaggerCreateEmployeeLoan() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new employee loan' }),
    ApiResponse({
      status: 201,
      description: 'Employee loan created successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - employee has pending loan',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllEmployeeLoans() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all employee loans with filtering and pagination',
    }),
    ApiQuery({
      name: 'employeeId',
      required: false,
      description: 'Filter by employee ID',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by status (pending, active, completed, rejected)',
    }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Items per page' }),
    ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order (asc or desc)',
    }),
    ApiResponse({
      status: 200,
      description: 'Employee loans retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetEmployeeLoan() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single employee loan by ID' }),
    ApiParam({ name: 'id', description: 'Employee loan UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee loan retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee loan not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateEmployeeLoan() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an employee loan' }),
    ApiParam({ name: 'id', description: 'Employee loan UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee loan updated successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee loan not found' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - cannot update approved or active loan',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteEmployeeLoan() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an employee loan' }),
    ApiParam({ name: 'id', description: 'Employee loan UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee loan deleted successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee loan not found' }),
    ApiResponse({
      status: 409,
      description: 'Conflict - cannot delete approved or active loan',
    }),
    ApiBearerAuth(),
  );
}

export function SwaggerApproveEmployeeLoan() {
  return applyDecorators(
    ApiOperation({ summary: 'Approve a pending employee loan' }),
    ApiParam({ name: 'id', description: 'Employee loan UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee loan approved successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - only pending loans can be approved',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee loan not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerRejectEmployeeLoan() {
  return applyDecorators(
    ApiOperation({ summary: 'Reject a pending employee loan' }),
    ApiParam({ name: 'id', description: 'Employee loan UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee loan rejected successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - only pending loans can be rejected',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee loan not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerPayLoanInstallment() {
  return applyDecorators(
    ApiOperation({ summary: 'Record a loan installment payment' }),
    ApiParam({ name: 'id', description: 'Employee loan UUID' }),
    ApiResponse({
      status: 200,
      description: 'Loan installment paid successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid payment amount or loan not active',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee loan not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetEmployeeActiveLoans() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all loans for a specific employee' }),
    ApiParam({ name: 'employeeId', description: 'Employee UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee loans retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
    ApiBearerAuth(),
  );
}

// ============================================================================
// EMPLOYEE DEDUCTION SWAGGER DECORATORS
// ============================================================================

export function SwaggerCreateEmployeeDeduction() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new employee deduction' }),
    ApiResponse({
      status: 201,
      description: 'Employee deduction created successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee or loan not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllEmployeeDeductions() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all employee deductions with filtering and pagination',
    }),
    ApiQuery({
      name: 'employeeId',
      required: false,
      description: 'Filter by employee ID',
    }),
    ApiQuery({
      name: 'deductionType',
      required: false,
      description: 'Filter by deduction type (tax, insurance, loan, other)',
    }),
    ApiQuery({
      name: 'loanId',
      required: false,
      description: 'Filter by loan ID',
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Filter by start date (YYYY-MM-DD)',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'Filter by end date (YYYY-MM-DD)',
    }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Items per page' }),
    ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order (asc or desc)',
    }),
    ApiResponse({
      status: 200,
      description: 'Employee deductions retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetEmployeeDeduction() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single employee deduction by ID' }),
    ApiParam({ name: 'id', description: 'Employee deduction UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee deduction retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee deduction not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerUpdateEmployeeDeduction() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an employee deduction' }),
    ApiParam({ name: 'id', description: 'Employee deduction UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee deduction updated successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee deduction not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerDeleteEmployeeDeduction() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an employee deduction' }),
    ApiParam({ name: 'id', description: 'Employee deduction UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee deduction deleted successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee deduction not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetEmployeeDeductionsSummary() {
  return applyDecorators(
    ApiOperation({ summary: 'Get deductions summary for a specific employee' }),
    ApiParam({ name: 'employeeId', description: 'Employee UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee deductions summary retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
    ApiBearerAuth(),
  );
}

// ============================================================================
// PAYROLL SUMMARY SWAGGER DECORATORS
// ============================================================================

export function SwaggerGetEmployeePayrollSummary() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get comprehensive payroll summary for a specific employee',
    }),
    ApiParam({ name: 'employeeId', description: 'Employee UUID' }),
    ApiResponse({
      status: 200,
      description: 'Employee payroll summary retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Employee not found' }),
    ApiBearerAuth(),
  );
}

export function SwaggerGetAllEmployeesPayrollSummary() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get payroll summary for all employees or specific employee IDs',
    }),
    ApiQuery({
      name: 'employeeIds',
      required: false,
      description: 'Comma-separated list of employee IDs to include',
    }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Items per page' }),
    ApiResponse({
      status: 200,
      description: 'Employees payroll summary retrieved successfully',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}
