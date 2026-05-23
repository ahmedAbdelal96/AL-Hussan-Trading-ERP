import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { TrackChanges } from '../../../common/decorators/track-changes.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { DeleteWithRowVersionDto } from '../../../common/dto';
import { UserEntity } from '../../auth/entities/user.entity';

// DTOs
import {
  UpdateSalaryDto,
  CreateAllowanceTypeDto,
  UpdateAllowanceTypeDto,
  AllowanceTypeFiltersDto,
  CreateEmployeeAllowanceDto,
  UpdateEmployeeAllowanceDto,
  EmployeeAllowanceFiltersDto,
  EmployeeAllowanceStatisticsDto,
  ApproveEmployeeAllowanceDto,
  RejectEmployeeAllowanceDto,
  CreateEmployeeLoanDto,
  UpdateEmployeeLoanDto,
  EmployeeLoanFiltersDto,
  EmployeeLoanStatisticsDto,
  ApproveEmployeeLoanDto,
  RejectEmployeeLoanDto,
  PayLoanInstallmentDto,
  CreateEmployeeDeductionDto,
  UpdateEmployeeDeductionDto,
  EmployeeDeductionFiltersDto,
  EmployeeDeductionStatisticsDto,
  ApproveEmployeeDeductionDto,
  RejectEmployeeDeductionDto,
  UnapproveEmployeeDeductionDto,
  PayrollStatisticsDto,
  ProcessPayrollDto,
  PreviewPayrollDto,
  UpdatePayslipPaymentDto,
  PayslipFiltersDto,
  PayslipResponseDto,
  ProcessPayrollResponseDto,
  PaginatedPayslipsDto,
  PayslipStatisticsDto,
  AllowanceTypeStatisticsDto,
} from '../dto';
import type { PreviewPayrollResponseDto } from '../dto/preview-payroll.dto';

// Use Cases
import {
  UpdateEmployeeSalaryUseCase,
  GetEmployeeSalaryHistoryUseCase,
  GetEmployeeSalaryStatsUseCase,
  CreateAllowanceTypeUseCase,
  GetAllowanceTypeUseCase,
  GetAllAllowanceTypesUseCase,
  GetAllowanceTypeStatisticsUseCase,
  UpdateAllowanceTypeUseCase,
  DeleteAllowanceTypeUseCase,
  CreateEmployeeAllowanceUseCase,
  GetEmployeeAllowanceUseCase,
  GetAllEmployeeAllowancesUseCase,
  UpdateEmployeeAllowanceUseCase,
  DeleteEmployeeAllowanceUseCase,
  ApproveEmployeeAllowanceUseCase,
  RejectEmployeeAllowanceUseCase,
  GetEmployeeActiveAllowancesUseCase,
  RestoreEmployeeAllowanceUseCase,
  ListDeletedEmployeeAllowancesUseCase,
  GetEmployeeAllowanceStatisticsUseCase,
  CreateEmployeeLoanUseCase,
  GetEmployeeLoanUseCase,
  GetAllEmployeeLoansUseCase,
  UpdateEmployeeLoanUseCase,
  DeleteEmployeeLoanUseCase,
  ApproveEmployeeLoanUseCase,
  RejectEmployeeLoanUseCase,
  PayLoanInstallmentUseCase,
  GetEmployeeActiveLoansUseCase,
  GetEmployeeLoanStatisticsUseCase,
  CreateEmployeeDeductionUseCase,
  GetEmployeeDeductionUseCase,
  GetAllEmployeeDeductionsUseCase,
  UpdateEmployeeDeductionUseCase,
  DeleteEmployeeDeductionUseCase,
  ApproveEmployeeDeductionUseCase,
  RejectEmployeeDeductionUseCase,
  UnapproveEmployeeDeductionUseCase,
  RestoreEmployeeDeductionUseCase,
  ListDeletedEmployeeDeductionsUseCase,
  GetEmployeeDeductionsSummaryUseCase,
  GetEmployeeDeductionStatisticsUseCase,
  GetAllEmployeesPayrollSummaryUseCase,
  GetEmployeePayrollSummaryUseCase,
  GetPayrollStatisticsUseCase,
  ProcessPayrollUseCase,
  PreviewPayrollUseCase,
  GetAllPayslipsUseCase,
  GetPayslipStatisticsUseCase,
  GetPayslipUseCase,
  GetEmployeePayslipsUseCase,
  UpdatePayslipPaymentUseCase,
} from '../use-cases';

// Swagger Decorators
import {
  SwaggerCreateAllowanceType,
  SwaggerGetAllAllowanceTypes,
  SwaggerGetAllowanceType,
  SwaggerUpdateAllowanceType,
  SwaggerDeleteAllowanceType,
  SwaggerCreateEmployeeAllowance,
  SwaggerGetAllEmployeeAllowances,
  SwaggerGetEmployeeAllowance,
  SwaggerUpdateEmployeeAllowance,
  SwaggerDeleteEmployeeAllowance,
  SwaggerApproveEmployeeAllowance,
  SwaggerRejectEmployeeAllowance,
  SwaggerGetEmployeeActiveAllowances,
  SwaggerCreateEmployeeLoan,
  SwaggerGetAllEmployeeLoans,
  SwaggerGetEmployeeLoan,
  SwaggerUpdateEmployeeLoan,
  SwaggerDeleteEmployeeLoan,
  SwaggerApproveEmployeeLoan,
  SwaggerRejectEmployeeLoan,
  SwaggerPayLoanInstallment,
  SwaggerGetEmployeeActiveLoans,
  SwaggerCreateEmployeeDeduction,
  SwaggerGetAllEmployeeDeductions,
  SwaggerGetEmployeeDeduction,
  SwaggerUpdateEmployeeDeduction,
  SwaggerDeleteEmployeeDeduction,
  SwaggerGetEmployeeDeductionsSummary,
  SwaggerGetAllEmployeesPayrollSummary,
  SwaggerGetEmployeePayrollSummary,
} from '../decorators/payroll-swagger.decorators';
import { AuditLog, NoAuditLog } from '../../../common/decorators';
import { AuditAction } from '@prisma/client';

/**
 * Payroll Controller
 * Handles all payroll-related operations:
 * - Allowance Types Management
 * - Employee Allowances Management
 * - Employee Loans Management
 * - Employee Deductions Management
 * - Payroll Summary & Reports
 */
@Controller('payroll')
@ApiTags('Payroll')
export class PayrollController {
  constructor(
    // Salary Management Use Cases
    private readonly updateEmployeeSalaryUseCase: UpdateEmployeeSalaryUseCase,
    private readonly getEmployeeSalaryHistoryUseCase: GetEmployeeSalaryHistoryUseCase,
    private readonly getEmployeeSalaryStatsUseCase: GetEmployeeSalaryStatsUseCase,

    // Allowance Type Use Cases
    private readonly createAllowanceTypeUseCase: CreateAllowanceTypeUseCase,
    private readonly getAllowanceTypeUseCase: GetAllowanceTypeUseCase,
    private readonly getAllAllowanceTypesUseCase: GetAllAllowanceTypesUseCase,
    private readonly getAllowanceTypeStatisticsUseCase: GetAllowanceTypeStatisticsUseCase,
    private readonly updateAllowanceTypeUseCase: UpdateAllowanceTypeUseCase,
    private readonly deleteAllowanceTypeUseCase: DeleteAllowanceTypeUseCase,

    // Employee Allowance Use Cases
    private readonly createEmployeeAllowanceUseCase: CreateEmployeeAllowanceUseCase,
    private readonly getEmployeeAllowanceUseCase: GetEmployeeAllowanceUseCase,
    private readonly getAllEmployeeAllowancesUseCase: GetAllEmployeeAllowancesUseCase,
    private readonly updateEmployeeAllowanceUseCase: UpdateEmployeeAllowanceUseCase,
    private readonly deleteEmployeeAllowanceUseCase: DeleteEmployeeAllowanceUseCase,
    private readonly approveEmployeeAllowanceUseCase: ApproveEmployeeAllowanceUseCase,
    private readonly rejectEmployeeAllowanceUseCase: RejectEmployeeAllowanceUseCase,
    private readonly getEmployeeActiveAllowancesUseCase: GetEmployeeActiveAllowancesUseCase,
    private readonly restoreEmployeeAllowanceUseCase: RestoreEmployeeAllowanceUseCase,
    private readonly listDeletedEmployeeAllowancesUseCase: ListDeletedEmployeeAllowancesUseCase,
    private readonly getEmployeeAllowanceStatisticsUseCase: GetEmployeeAllowanceStatisticsUseCase,

    // Employee Loan Use Cases
    private readonly createEmployeeLoanUseCase: CreateEmployeeLoanUseCase,
    private readonly getEmployeeLoanUseCase: GetEmployeeLoanUseCase,
    private readonly getAllEmployeeLoansUseCase: GetAllEmployeeLoansUseCase,
    private readonly updateEmployeeLoanUseCase: UpdateEmployeeLoanUseCase,
    private readonly deleteEmployeeLoanUseCase: DeleteEmployeeLoanUseCase,
    private readonly approveEmployeeLoanUseCase: ApproveEmployeeLoanUseCase,
    private readonly rejectEmployeeLoanUseCase: RejectEmployeeLoanUseCase,
    private readonly payLoanInstallmentUseCase: PayLoanInstallmentUseCase,
    private readonly getEmployeeActiveLoansUseCase: GetEmployeeActiveLoansUseCase,
    private readonly getEmployeeLoanStatisticsUseCase: GetEmployeeLoanStatisticsUseCase,

    // Employee Deduction Use Cases
    private readonly createEmployeeDeductionUseCase: CreateEmployeeDeductionUseCase,
    private readonly getEmployeeDeductionUseCase: GetEmployeeDeductionUseCase,
    private readonly getAllEmployeeDeductionsUseCase: GetAllEmployeeDeductionsUseCase,
    private readonly updateEmployeeDeductionUseCase: UpdateEmployeeDeductionUseCase,
    private readonly deleteEmployeeDeductionUseCase: DeleteEmployeeDeductionUseCase,
    private readonly approveEmployeeDeductionUseCase: ApproveEmployeeDeductionUseCase,
    private readonly rejectEmployeeDeductionUseCase: RejectEmployeeDeductionUseCase,
    private readonly unapproveEmployeeDeductionUseCase: UnapproveEmployeeDeductionUseCase,
    private readonly restoreEmployeeDeductionUseCase: RestoreEmployeeDeductionUseCase,
    private readonly listDeletedEmployeeDeductionsUseCase: ListDeletedEmployeeDeductionsUseCase,
    private readonly getEmployeeDeductionsSummaryUseCase: GetEmployeeDeductionsSummaryUseCase,
    private readonly getEmployeeDeductionStatisticsUseCase: GetEmployeeDeductionStatisticsUseCase,

    // Payroll Summary Use Cases
    private readonly getAllEmployeesPayrollSummaryUseCase: GetAllEmployeesPayrollSummaryUseCase,
    private readonly getEmployeePayrollSummaryUseCase: GetEmployeePayrollSummaryUseCase,

    // Payroll Statistics Use Case
    private readonly getPayrollStatisticsUseCase: GetPayrollStatisticsUseCase,

    // Payslip Use Cases
    private readonly processPayrollUseCase: ProcessPayrollUseCase,
    private readonly previewPayrollUseCase: PreviewPayrollUseCase,
    private readonly getAllPayslipsUseCase: GetAllPayslipsUseCase,
    private readonly getPayslipStatisticsUseCase: GetPayslipStatisticsUseCase,
    private readonly getPayslipUseCase: GetPayslipUseCase,
    private readonly getEmployeePayslipsUseCase: GetEmployeePayslipsUseCase,
    private readonly updatePayslipPaymentUseCase: UpdatePayslipPaymentUseCase,
  ) {}

  // ============================================================================
  // SALARY MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Update Employee Salary (Dedicated Endpoint)
   *
   * @description Updates only the salary for an employee with optimistic locking
   * All changes are automatically logged in salary_history table
   *
   * @param employeeId - Employee UUID
   * @param dto - Salary update data with version for concurrency control
   * @param user - Current authenticated user
   * @returns Updated employee with new salary and incremented version
   *
   * @throws ConflictException if version mismatch (concurrent update detected)
   * @throws NotFoundException if employee doesn't exist
   * @throws BadRequestException if salary unchanged or invalid
   */
  @Patch('employees/:employeeId/salary')
  @AuditLog({ resourceType: 'employee-salary', action: AuditAction.UPDATE })
  @Auth({ roles: ['ADMIN', 'SUPERADMIN', 'HR_MANAGER'] })
  @ApiOperation({
    summary: 'Update Employee Salary',
    description:
      'Updates employee salary with optimistic locking to prevent concurrent update conflicts. All changes are logged in salary history.',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Employee UUID',
    type: String,
  })
  @ApiBody({ type: UpdateSalaryDto })
  @ApiResponse({
    status: 200,
    description: 'Salary updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Version mismatch - data was modified by another user. Please refresh and try again.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid salary or salary unchanged',
  })
  async updateEmployeeSalary(
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateSalaryDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.updateEmployeeSalaryUseCase.execute(employeeId, dto, user.id);
  }

  /**
   * Get Employee Salary History
   */
  @Get('employees/:employeeId/salary-history')
  @NoAuditLog()
  @Auth({
    roles: ['HR_MANAGER', 'HR_STAFF', 'FIN_MANAGER', 'ADMIN'],
    permissions: ['payroll:read'],
  })
  @ApiOperation({
    summary: 'Get Employee Salary History',
    description: 'Returns paginated salary history records for the employee.',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Employee UUID',
    type: String,
  })
  async getEmployeeSalaryHistory(
    @Param('employeeId') employeeId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.getEmployeeSalaryHistoryUseCase.execute(employeeId, query);
  }

  /**
   * Get Employee Salary Statistics
   */
  @Get('employees/:employeeId/salary-stats')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get Employee Salary Statistics',
    description: 'Returns analytics about salary changes for the employee.',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Employee UUID',
    type: String,
  })
  async getEmployeeSalaryStats(@Param('employeeId') employeeId: string) {
    return this.getEmployeeSalaryStatsUseCase.execute(employeeId);
  }

  // ============================================================================
  // ALLOWANCE TYPE ENDPOINTS
  // ============================================================================

  @Post('allowance-types')
  @AuditLog({ resourceType: 'allowance-type', action: AuditAction.CREATE })
  @Auth({ permissions: ['payroll:write'] })
  @SwaggerCreateAllowanceType()
  async createAllowanceType(
    @Body() dto: CreateAllowanceTypeDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.createAllowanceTypeUseCase.execute(dto, user.id);
  }

  @Get('allowance-types')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetAllAllowanceTypes()
  async getAllAllowanceTypes(@Query() filters: AllowanceTypeFiltersDto) {
    return this.getAllAllowanceTypesUseCase.execute(filters);
  }

  @Get('allowance-types/statistics')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get allowance type list statistics',
    description:
      'Returns total/active/inactive counts for allowance types independent of pagination.',
  })
  async getAllowanceTypeStatistics(
    @Query() filters: AllowanceTypeFiltersDto,
  ): Promise<AllowanceTypeStatisticsDto> {
    return this.getAllowanceTypeStatisticsUseCase.execute({
      search: filters.search,
    });
  }

  @Get('allowance-types/:id')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetAllowanceType()
  async getAllowanceType(@Param('id') id: string) {
    return this.getAllowanceTypeUseCase.execute(id);
  }

  @Put('allowance-types/:id')
  @AuditLog({ resourceType: 'allowance-type', action: AuditAction.UPDATE })
  @TrackChanges('allowance-type')
  @Auth({ permissions: ['payroll:write'] })
  @SwaggerUpdateAllowanceType()
  async updateAllowanceType(
    @Param('id') id: string,
    @Body() dto: UpdateAllowanceTypeDto,
  ) {
    return this.updateAllowanceTypeUseCase.execute(id, dto);
  }

  @Delete('allowance-types/:id')
  @AuditLog({ resourceType: 'allowance-type', action: AuditAction.DELETE })
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
  @SwaggerDeleteAllowanceType()
  async deleteAllowanceType(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
  ) {
    return this.deleteAllowanceTypeUseCase.execute(id, dto.rowVersion);
  }

  // ============================================================================
  // EMPLOYEE ALLOWANCE ENDPOINTS
  // ============================================================================

  @Post('allowances')
  @AuditLog({ resourceType: 'employee-allowance', action: AuditAction.CREATE })
  @Auth({
    roles: ['HR_MANAGER', 'ADMIN', 'SUPERADMIN'],
    permissions: ['payroll:write'],
  })
  @SwaggerCreateEmployeeAllowance()
  async createEmployeeAllowance(
    @Body() dto: CreateEmployeeAllowanceDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.createEmployeeAllowanceUseCase.execute(dto, user.id);
  }

  @Get('allowances')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetAllEmployeeAllowances()
  async getAllEmployeeAllowances(
    @Query() filters: EmployeeAllowanceFiltersDto,
  ) {
    return this.getAllEmployeeAllowancesUseCase.execute(filters);
  }

  @Get('allowances/statistics')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get employee allowances list statistics',
    description:
      'Returns total/pending/approved/rejected counts for employee allowances independent of pagination.',
  })
  async getEmployeeAllowanceStatistics(
    @Query() filters: EmployeeAllowanceFiltersDto,
  ): Promise<EmployeeAllowanceStatisticsDto> {
    return this.getEmployeeAllowanceStatisticsUseCase.execute(filters);
  }

  @Get('allowances/deleted')
  @NoAuditLog()
  @Auth({ roles: ['SUPERADMIN'] })
  @ApiOperation({
    summary: 'Get all soft-deleted employee allowances (SUPERADMIN only)',
    description:
      'Retrieves all soft-deleted employee allowances for recovery purposes',
  })
  @ApiResponse({
    status: 200,
    description: 'Deleted allowances retrieved successfully',
  })
  async getDeletedEmployeeAllowances(
    @Query() filters: EmployeeAllowanceFiltersDto,
  ) {
    return await this.listDeletedEmployeeAllowancesUseCase.execute(filters);
  }

  @Get('allowances/employee/:employeeId')
  @NoAuditLog()
  @Auth({
    roles: ['HR_MANAGER', 'HR_STAFF', 'FIN_MANAGER', 'ADMIN'],
    permissions: ['payroll:read'],
  })
  @SwaggerGetEmployeeActiveAllowances()
  async getEmployeeAllowancesByEmployee(
    @Param('employeeId') employeeId: string,
  ) {
    return this.getEmployeeActiveAllowancesUseCase.execute(employeeId);
  }

  @Get('allowances/:id')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetEmployeeAllowance()
  async getEmployeeAllowance(@Param('id') id: string) {
    return this.getEmployeeAllowanceUseCase.execute(id);
  }

  @Put('allowances/:id')
  @AuditLog({ resourceType: 'employee-allowance', action: AuditAction.UPDATE })
  @TrackChanges('employee-allowance')
  @Auth({
    roles: ['HR_MANAGER', 'ADMIN', 'SUPERADMIN'],
    permissions: ['payroll:write'],
  })
  @SwaggerUpdateEmployeeAllowance()
  async updateEmployeeAllowance(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeAllowanceDto,
  ) {
    return this.updateEmployeeAllowanceUseCase.execute(id, dto);
  }

  @Delete('allowances/:id')
  @AuditLog({ resourceType: 'employee-allowance', action: AuditAction.DELETE })
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
  @SwaggerDeleteEmployeeAllowance()
  async deleteEmployeeAllowance(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.deleteEmployeeAllowanceUseCase.execute(
      id,
      user.id,
      dto.rowVersion,
    );
  }

  @Post('allowances/:id/approve')
  @AuditLog({ resourceType: 'employee-allowance', action: AuditAction.APPROVE })
  @Auth({ permissions: ['payroll:approve'] })
  @SwaggerApproveEmployeeAllowance()
  async approveEmployeeAllowance(
    @Param('id') id: string,
    @Body() dto: ApproveEmployeeAllowanceDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.approveEmployeeAllowanceUseCase.execute(id, dto, user.id);
  }

  @Post('allowances/:id/reject')
  @AuditLog({ resourceType: 'employee-allowance', action: AuditAction.REJECT })
  @Auth({ permissions: ['payroll:approve'] })
  @SwaggerRejectEmployeeAllowance()
  async rejectEmployeeAllowance(
    @Param('id') id: string,
    @Body() dto: RejectEmployeeAllowanceDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.rejectEmployeeAllowanceUseCase.execute(id, dto, user.id);
  }

  @Post('allowances/:id/restore')
  @AuditLog({ resourceType: 'employee-allowance', action: AuditAction.RESTORE })
  @Auth({ roles: ['SUPERADMIN'] })
  @ApiOperation({
    summary: 'Restore a soft-deleted employee allowance (SUPERADMIN only)',
    description: 'Restores a soft-deleted employee allowance to active state',
  })
  @ApiResponse({
    status: 200,
    description: 'Allowance restored successfully',
  })
  async restoreEmployeeAllowance(@Param('id') id: string) {
    return await this.restoreEmployeeAllowanceUseCase.execute(id);
  }

  // ============================================================================
  // EMPLOYEE LOAN ENDPOINTS
  // ============================================================================

  @Post('loans')
  @AuditLog({ resourceType: 'employee-loan', action: AuditAction.CREATE })
  @Auth({
    roles: ['HR_MANAGER', 'ADMIN', 'SUPERADMIN'],
    permissions: ['payroll:write'],
  })
  @SwaggerCreateEmployeeLoan()
  async createEmployeeLoan(
    @Body() dto: CreateEmployeeLoanDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.createEmployeeLoanUseCase.execute(dto, user.id);
  }

  @Get('loans')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetAllEmployeeLoans()
  async getAllEmployeeLoans(@Query() filters: EmployeeLoanFiltersDto) {
    return this.getAllEmployeeLoansUseCase.execute(filters);
  }

  @Get('loans/statistics')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get employee loans list statistics',
    description:
      'Returns total/pending/active/completed counts for employee loans independent of pagination.',
  })
  async getEmployeeLoanStatistics(
    @Query() filters: EmployeeLoanFiltersDto,
  ): Promise<EmployeeLoanStatisticsDto> {
    return this.getEmployeeLoanStatisticsUseCase.execute(filters);
  }

  @Get('loans/:id')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetEmployeeLoan()
  async getEmployeeLoan(@Param('id') id: string) {
    return this.getEmployeeLoanUseCase.execute(id);
  }

  @Put('loans/:id')
  @AuditLog({ resourceType: 'employee-loan', action: AuditAction.UPDATE })
  @TrackChanges('employee-loan')
  @Auth({
    roles: ['HR_MANAGER', 'ADMIN', 'SUPERADMIN'],
    permissions: ['payroll:write'],
  })
  @SwaggerUpdateEmployeeLoan()
  async updateEmployeeLoan(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeLoanDto,
  ) {
    return this.updateEmployeeLoanUseCase.execute(id, dto);
  }

  @Delete('loans/:id')
  @AuditLog({ resourceType: 'employee-loan', action: AuditAction.DELETE })
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
  @SwaggerDeleteEmployeeLoan()
  async deleteEmployeeLoan(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
  ) {
    return this.deleteEmployeeLoanUseCase.execute(id, dto.rowVersion);
  }

  @Post('loans/:id/approve')
  @AuditLog({ resourceType: 'employee-loan', action: AuditAction.APPROVE })
  @Auth({ permissions: ['payroll:approve'] })
  @SwaggerApproveEmployeeLoan()
  async approveEmployeeLoan(
    @Param('id') id: string,
    @Body() dto: ApproveEmployeeLoanDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.approveEmployeeLoanUseCase.execute(id, dto, user.id);
  }

  @Post('loans/:id/reject')
  @AuditLog({ resourceType: 'employee-loan', action: AuditAction.REJECT })
  @Auth({ permissions: ['payroll:approve'] })
  @SwaggerRejectEmployeeLoan()
  async rejectEmployeeLoan(
    @Param('id') id: string,
    @Body() dto: RejectEmployeeLoanDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.rejectEmployeeLoanUseCase.execute(id, dto, user.id);
  }

  @Post('loans/:id/pay')
  @AuditLog({ resourceType: 'employee-loan', action: AuditAction.UPDATE })
  @Auth({ permissions: ['payroll:write'] })
  @SwaggerPayLoanInstallment()
  async payEmployeeLoan(
    @Param('id') id: string,
    @Body() dto: PayLoanInstallmentDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.payLoanInstallmentUseCase.execute(id, dto, user.id);
  }

  @Get('loans/employee/:employeeId')
  @NoAuditLog()
  @Auth({
    roles: ['HR_MANAGER', 'HR_STAFF', 'FIN_MANAGER', 'ADMIN'],
    permissions: ['payroll:read'],
  })
  @SwaggerGetEmployeeActiveLoans()
  async getEmployeeLoansByEmployee(@Param('employeeId') employeeId: string) {
    return this.getEmployeeActiveLoansUseCase.execute(employeeId);
  }

  // ============================================================================
  // EMPLOYEE DEDUCTION ENDPOINTS
  // ============================================================================

  @Post('deductions')
  @AuditLog({ resourceType: 'employee-deduction', action: AuditAction.CREATE })
  @Auth({
    roles: ['HR_MANAGER', 'ADMIN', 'SUPERADMIN'],
    permissions: ['payroll:write'],
  })
  @SwaggerCreateEmployeeDeduction()
  async createEmployeeDeduction(
    @Body() dto: CreateEmployeeDeductionDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.createEmployeeDeductionUseCase.execute(dto, user.id);
  }

  @Get('deductions')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetAllEmployeeDeductions()
  async getAllEmployeeDeductions(
    @Query() filters: EmployeeDeductionFiltersDto,
  ) {
    return this.getAllEmployeeDeductionsUseCase.execute(filters);
  }

  @Get('deductions/statistics')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get employee deductions list statistics',
    description:
      'Returns total/pending/approved/rejected counts for employee deductions independent of pagination.',
  })
  async getEmployeeDeductionStatistics(
    @Query() filters: EmployeeDeductionFiltersDto,
  ): Promise<EmployeeDeductionStatisticsDto> {
    return this.getEmployeeDeductionStatisticsUseCase.execute(filters);
  }

  @Get('deductions/deleted')
  @NoAuditLog()
  @Auth({ roles: ['SUPERADMIN'] })
  getDeletedEmployeeDeductions(
    @Query('employeeId') employeeId?: string,
    @Query('deductionType') deductionType?: string,
    @Query('loanId') loanId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.listDeletedEmployeeDeductionsUseCase.execute({
      employeeId,
      deductionType: deductionType as any,
      loanId,
      startDate,
      endDate,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get('deductions/employee/:employeeId')
  @NoAuditLog()
  @Auth({
    roles: ['HR_MANAGER', 'HR_STAFF', 'FIN_MANAGER', 'ADMIN'],
    permissions: ['payroll:read'],
  })
  @SwaggerGetEmployeeDeductionsSummary()
  async getEmployeeDeductionsByEmployee(
    @Param('employeeId') employeeId: string,
  ) {
    // Return full deduction list for employee (not just summary)
    const result = await this.getAllEmployeeDeductionsUseCase.execute({
      employeeId,
      page: 1,
      limit: 1000, // Get all deductions for this employee
    });

    // Return array directly (frontend expects array, not paginated response)
    return result.data;
  }

  @Get('deductions/employee/:employeeId/summary')
  @NoAuditLog()
  @Auth({
    roles: ['HR_MANAGER', 'HR_STAFF', 'FIN_MANAGER', 'ADMIN'],
    permissions: ['payroll:read'],
  })
  @SwaggerGetEmployeeDeductionsSummary()
  async getEmployeeDeductionsSummary(@Param('employeeId') employeeId: string) {
    // Return aggregated summary only
    return this.getEmployeeDeductionsSummaryUseCase.execute(employeeId);
  }

  @Get('deductions/:id')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetEmployeeDeduction()
  async getEmployeeDeduction(@Param('id') id: string) {
    return this.getEmployeeDeductionUseCase.execute(id);
  }

  @Put('deductions/:id')
  @AuditLog({ resourceType: 'employee-deduction', action: AuditAction.UPDATE })
  @TrackChanges('employee-deduction')
  @Auth({
    roles: ['HR_MANAGER', 'ADMIN', 'SUPERADMIN'],
    permissions: ['payroll:write'],
  })
  @SwaggerUpdateEmployeeDeduction()
  async updateEmployeeDeduction(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDeductionDto,
  ) {
    return this.updateEmployeeDeductionUseCase.execute(id, dto);
  }

  @Delete('deductions/:id')
  @AuditLog({ resourceType: 'employee-deduction', action: AuditAction.DELETE })
  @Auth({ roles: ['ADMIN', 'SUPERADMIN'] })
  @SwaggerDeleteEmployeeDeduction()
  async deleteEmployeeDeduction(
    @Param('id') id: string,
    @Body() dto: DeleteWithRowVersionDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.deleteEmployeeDeductionUseCase.execute(
      id,
      user.id,
      dto.rowVersion,
    );
  }

  @Post('deductions/:id/approve')
  @AuditLog({ resourceType: 'employee-deduction', action: AuditAction.APPROVE })
  @Auth({ permissions: ['payroll:approve'] })
  @TrackChanges('employee-deduction-approve')
  async approveEmployeeDeduction(
    @Param('id') id: string,
    @Body() dto: ApproveEmployeeDeductionDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.approveEmployeeDeductionUseCase.execute(id, dto, user.id);
  }

  @Post('deductions/:id/reject')
  @AuditLog({ resourceType: 'employee-deduction', action: AuditAction.REJECT })
  @Auth({ permissions: ['payroll:approve'] })
  @TrackChanges('employee-deduction-reject')
  async rejectEmployeeDeduction(
    @Param('id') id: string,
    @Body() dto: RejectEmployeeDeductionDto,
    @CurrentUser() user: UserEntity,
  ) {
    await this.rejectEmployeeDeductionUseCase.execute(id, dto, user.id);
    return { message: 'Employee deduction rejected successfully' };
  }

  @Post('deductions/:id/unapprove')
  @AuditLog({ resourceType: 'employee-deduction', action: AuditAction.UPDATE })
  @Auth({ permissions: ['payroll:approve'] })
  @TrackChanges('employee-deduction-unapprove')
  async unapproveEmployeeDeduction(
    @Param('id') id: string,
    @Body() dto: UnapproveEmployeeDeductionDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.unapproveEmployeeDeductionUseCase.execute(id, dto, user.id);
  }

  @Post('deductions/:id/restore')
  @AuditLog({ resourceType: 'employee-deduction', action: AuditAction.RESTORE })
  @Auth({ roles: ['SUPERADMIN'] })
  @TrackChanges('employee-deduction-restore')
  restoreEmployeeDeduction(@Param('id') id: string) {
    return this.restoreEmployeeDeductionUseCase.execute(id);
  }

  // ============================================================================
  // PAYROLL SUMMARY & REPORTS ENDPOINTS
  // ============================================================================

  @Get('summary')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetAllEmployeesPayrollSummary()
  async getPayrollSummary(@Query('employeeIds') employeeIds?: string) {
    // Parse comma-separated employee IDs if provided, otherwise get all
    const employeeIdArray = employeeIds
      ? employeeIds.split(',').map((id) => id.trim())
      : [];
    return this.getAllEmployeesPayrollSummaryUseCase.execute(employeeIdArray);
  }

  @Get('summary/employee/:employeeId')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @SwaggerGetEmployeePayrollSummary()
  async getEmployeePayrollSummary(@Param('employeeId') employeeId: string) {
    return this.getEmployeePayrollSummaryUseCase.execute(employeeId);
  }

  // ============================================================================
  // PAYROLL STATISTICS ENDPOINT
  // ============================================================================

  /**
   * Get Payroll Statistics
   *
   * Returns comprehensive payroll analytics including:
   * - Total payroll overview (base salaries, allowances, deductions)
   * - Employment type distribution
   * - Department-wise breakdown
   * - Allowance and deduction analysis
   * - Loan status tracking
   * - Monthly trends (last 6 months)
   * - Top earning employees
   * - Growth metrics
   *
   * @param startDate - Optional start date for filtering (ISO format)
   * @param endDate - Optional end date for filtering (ISO format)
   * @returns PayrollStatisticsDto
   *
   * @example
   * GET /api/payroll/statistics
   * GET /api/payroll/statistics?startDate=2026-01-01&endDate=2026-01-31
   */
  @Get('statistics')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get comprehensive payroll statistics',
    description:
      'Returns detailed payroll analytics including breakdowns, trends, and insights',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: PayrollStatisticsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for filtering (ISO format)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for filtering (ISO format)',
    example: '2026-01-31',
  })
  async getPayrollStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PayrollStatisticsDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.getPayrollStatisticsUseCase.execute(start, end);
  }

  // ============================================================================
  // PAYSLIP ENDPOINTS
  // ============================================================================

  /**
   * Preview Payroll
   *
   * Calculates salary components for all employees WITHOUT saving.
   * Used to show management what payroll would look like before processing.
   *
   * @param dto - Month, year, and optional employee IDs
   * @returns PreviewPayrollResponseDto with calculated salaries
   */
  @Post('preview')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Preview payroll calculations without saving',
    description:
      'Calculates salary components for all active employees without creating payslips. Includes alreadyProcessed flag.',
  })
  @ApiBody({ type: PreviewPayrollDto })
  async previewPayroll(
    @Body() dto: PreviewPayrollDto,
  ): Promise<PreviewPayrollResponseDto> {
    return this.previewPayrollUseCase.execute(dto);
  }

  /**
   * Process Monthly Payroll
   *
   * Generates payslips for all active employees for the specified month/year.
   * Calculates gross salary (base + allowances) and net salary (gross - deductions).
   * Includes salary structure, active allowances, loan deductions, and monthly deductions.
   *
   * @param processPayrollDto - Month, year, and optional employee IDs
   * @returns ProcessPayrollResponseDto with batch processing results
   *
   * @example
   * POST /api/payroll/process
   * Body: { "month": 1, "year": 2024, "payDate": "2024-01-31" }
   */
  @Post('process')
  @AuditLog({ resourceType: 'payroll', action: AuditAction.CREATE })
  @Auth({ permissions: ['payroll:process'] })
  @ApiOperation({
    summary: 'Process monthly payroll for employees',
    description:
      'Generates payslips with complete salary calculations including allowances, deductions, loans, and working days',
  })
  @ApiResponse({
    status: 201,
    description: 'Payroll processed successfully',
    type: ProcessPayrollResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiBody({ type: ProcessPayrollDto })
  async processPayroll(
    @Body() processPayrollDto: ProcessPayrollDto,
    @CurrentUser() user: UserEntity,
  ): Promise<ProcessPayrollResponseDto> {
    return this.processPayrollUseCase.execute(processPayrollDto, user.id);
  }

  /**
   * Get Payslip List Statistics
   *
   * Returns aggregate KPIs for payslips list cards, independent of page/limit.
   */
  @Get('payslips/statistics')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get payslip list statistics',
    description:
      'Returns aggregate payslip KPIs (total/paid/unpaid/totalNetAmount) independent of pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payslip statistics retrieved successfully',
    type: PayslipStatisticsDto,
  })
  async getPayslipStatistics(
    @Query() filters: PayslipFiltersDto,
  ): Promise<PayslipStatisticsDto> {
    return this.getPayslipStatisticsUseCase.execute(filters);
  }

  /**
   * Get All Payslips
   *
   * Returns paginated list of payslips with optional filtering.
   * Supports filtering by employee, month, year, payment status, department.
   *
   * @param filters - PayslipFiltersDto with pagination and sorting
   * @returns PaginatedPayslipsDto
   *
   * @example
   * GET /api/payroll/payslips?page=1&limit=10&isPaid=true
   */
  @Get('payslips')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get all payslips with filters',
    description:
      'Returns paginated payslips with flexible filtering and sorting options',
  })
  @ApiResponse({
    status: 200,
    description: 'Payslips retrieved successfully',
    type: PaginatedPayslipsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    type: String,
    description: 'Filter by employee ID',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Filter by month (1-12)',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filter by year',
  })
  @ApiQuery({
    name: 'isPaid',
    required: false,
    type: Boolean,
    description: 'Filter by payment status',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    type: String,
    description: 'Filter by department',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
    example: 'payDate',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction',
  })
  async getAllPayslips(
    @Query() filters: PayslipFiltersDto,
  ): Promise<PaginatedPayslipsDto> {
    return this.getAllPayslipsUseCase.execute(filters);
  }

  /**
   * Get Single Payslip
   *
   * Returns detailed information for a specific payslip by ID.
   * Includes employee information and all salary components.
   *
   * @param id - Payslip UUID
   * @returns PayslipResponseDto
   *
   * @example
   * GET /api/payroll/payslips/123e4567-e89b-12d3-a456-426614174000
   */
  @Get('payslips/:id')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get payslip by ID',
    description:
      'Returns complete payslip details including employee information',
  })
  @ApiResponse({
    status: 200,
    description: 'Payslip retrieved successfully',
    type: PayslipResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Payslip not found' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Payslip UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async getPayslip(@Param('id') id: string): Promise<PayslipResponseDto> {
    return this.getPayslipUseCase.execute(id);
  }

  /**
   * Get Employee Payslips
   *
   * Returns all payslips for a specific employee, sorted by date descending.
   *
   * @param employeeId - Employee UUID
   * @returns Array of PayslipResponseDto
   *
   * @example
   * GET /api/payroll/employees/123e4567-e89b-12d3-a456-426614174000/payslips
   */
  @Get('employees/:employeeId/payslips')
  @NoAuditLog()
  @Auth({ permissions: ['payroll:read'] })
  @ApiOperation({
    summary: 'Get all payslips for an employee',
    description: 'Returns employee payslip history sorted by date',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee payslips retrieved successfully',
    type: [PayslipResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({
    name: 'employeeId',
    type: String,
    description: 'Employee UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async getEmployeePayslips(
    @Param('employeeId') employeeId: string,
  ): Promise<PayslipResponseDto[]> {
    return this.getEmployeePayslipsUseCase.execute(employeeId);
  }

  /**
   * Update Payslip Payment Status
   *
   * Marks a payslip as paid or unpaid. Updates payment date and method.
   *
   * @param id - Payslip UUID
   * @param updatePaymentDto - Payment status and details
   * @returns PayslipResponseDto
   *
   * @example
   * PATCH /api/payroll/payslips/123e4567-e89b-12d3-a456-426614174000/payment
   * Body: { "isPaid": true, "payMethod": "BANK_TRANSFER" }
   */
  @Patch('payslips/:id/payment')
  @AuditLog({ resourceType: 'payslip', action: AuditAction.UPDATE })
  @Auth({ permissions: ['payroll:update'] })
  @ApiOperation({
    summary: 'Update payslip payment status',
    description: 'Marks payslip as paid/unpaid with payment details',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status updated successfully',
    type: PayslipResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Payslip not found' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Payslip UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdatePayslipPaymentDto })
  async updatePayslipPayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePayslipPaymentDto,
    @CurrentUser() user: UserEntity,
  ): Promise<PayslipResponseDto> {
    return this.updatePayslipPaymentUseCase.execute(
      id,
      updatePaymentDto,
      user.id,
    );
  }
}
