/**
 * ============================================================================
 * PAYROLL REPORTS - RESPONSE DTOs (Part 1: Reports 1-4)
 * ============================================================================
 *
 * Type-safe response structures for payroll reports.
 * Frontend-friendly with metadata, percentages, and chart-ready formats.
 *
 * Design Principles:
 * - Self-documenting with Swagger decorators
 * - Include calculated fields (percentages, averages, trends)
 * - Provide metadata for UI rendering (currency, timestamps)
 * - Chart-ready data structures
 * - Consistent naming conventions
 *
 * @module PayrollReportsResponses
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ============================================================================
 * REPORT 1: MONTHLY PAYROLL OVERVIEW
 * ============================================================================
 */

/**
 * KPI Summary for monthly payroll overview
 * Provides high-level metrics for dashboard cards
 */
export class PayrollOverviewResponseDto {
  @ApiProperty({
    description: 'Total base salaries for the month',
    example: 500000,
  })
  totalBaseSalaries: number;

  @ApiProperty({
    description: 'Total allowances for the month',
    example: 150000,
  })
  totalAllowances: number;

  @ApiProperty({
    description: 'Total deductions for the month',
    example: 50000,
  })
  totalDeductions: number;

  @ApiProperty({
    description: 'Net payroll (base + allowances - deductions)',
    example: 600000,
  })
  netPayroll: number;

  @ApiProperty({ description: 'Total number of employees', example: 250 })
  employeeCount: number;

  @ApiProperty({
    description: 'Average net salary per employee',
    example: 2400,
  })
  avgSalaryPerEmployee: number;

  @ApiProperty({ description: 'Average base salary', example: 2000 })
  avgBaseSalary: number;

  @ApiProperty({ description: 'Average allowances per employee', example: 600 })
  avgAllowances: number;

  @ApiProperty({ description: 'Average deductions per employee', example: 200 })
  avgDeductions: number;

  @ApiPropertyOptional({
    description: 'Month-over-month growth rate (%)',
    example: 5.2,
    nullable: true,
  })
  monthGrowthRate?: number;

  @ApiPropertyOptional({
    description: 'Previous month net payroll for comparison',
    example: 570000,
    nullable: true,
  })
  previousMonthPayroll?: number;

  @ApiPropertyOptional({
    description: 'Previous month employee count',
    example: 245,
    nullable: true,
  })
  previousMonthEmployeeCount?: number;

  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Month of the report (1-12)', example: 1 })
  month: number;

  @ApiProperty({ description: 'Year of the report', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 2: PAYROLL BY DEPARTMENT
 * ============================================================================
 */

/**
 * Payroll breakdown for a single department
 */
export class DepartmentPayrollItemDto {
  @ApiProperty({
    description: 'Department ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  departmentId: string;

  @ApiProperty({ description: 'Department name', example: 'Engineering' })
  departmentName: string;

  @ApiPropertyOptional({
    description: 'Department name in Arabic',
    example: 'الهندسة',
  })
  departmentNameAr?: string;

  @ApiProperty({
    description: 'Number of employees in department',
    example: 50,
  })
  employeeCount: number;

  @ApiProperty({ description: 'Total base salaries', example: 100000 })
  totalBaseSalaries: number;

  @ApiProperty({ description: 'Total allowances', example: 30000 })
  totalAllowances: number;

  @ApiProperty({ description: 'Total deductions', example: 10000 })
  totalDeductions: number;

  @ApiProperty({ description: 'Net payroll for department', example: 120000 })
  netPayroll: number;

  @ApiProperty({
    description: 'Percentage of total company payroll',
    example: 20.5,
  })
  percentageOfTotal: number;

  @ApiProperty({ description: 'Average salary per employee', example: 2400 })
  avgSalaryPerEmployee: number;

  @ApiProperty({ description: 'Average base salary', example: 2000 })
  avgBaseSalary: number;

  @ApiProperty({ description: 'Average allowances', example: 600 })
  avgAllowances: number;

  @ApiProperty({ description: 'Average deductions', example: 200 })
  avgDeductions: number;
}

/**
 * Complete department payroll report response
 */
export class PayrollByDepartmentResponseDto {
  @ApiProperty({
    type: [DepartmentPayrollItemDto],
    description: 'Payroll breakdown by department',
  })
  departments: DepartmentPayrollItemDto[];

  @ApiProperty({
    description: 'Total company payroll (all departments)',
    example: 600000,
  })
  totalPayroll: number;

  @ApiProperty({ description: 'Total number of employees', example: 250 })
  totalEmployees: number;

  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Month of report', example: 1 })
  month: number;

  @ApiProperty({ description: 'Year of report', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 3: PAYROLL BY SITE
 * ============================================================================
 */

/**
 * Payroll breakdown for a single site
 */
export class SitePayrollItemDto {
  @ApiProperty({
    description: 'Site ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  siteId: string;

  @ApiProperty({ description: 'Site name', example: 'Riyadh Office' })
  siteName: string;

  @ApiPropertyOptional({
    description: 'Site name in Arabic',
    example: 'مكتب الرياض',
  })
  siteNameAr?: string;

  @ApiProperty({ description: 'Site code', example: 'RUH-01' })
  siteCode: string;

  @ApiProperty({ description: 'Number of employees at site', example: 80 })
  employeeCount: number;

  @ApiProperty({ description: 'Total base salaries', example: 160000 })
  totalBaseSalaries: number;

  @ApiProperty({ description: 'Total allowances', example: 48000 })
  totalAllowances: number;

  @ApiProperty({ description: 'Total deductions', example: 16000 })
  totalDeductions: number;

  @ApiProperty({ description: 'Net payroll for site', example: 192000 })
  netPayroll: number;

  @ApiProperty({
    description: 'Percentage of total company payroll',
    example: 32.0,
  })
  percentageOfTotal: number;

  @ApiProperty({ description: 'Average salary per employee', example: 2400 })
  avgSalaryPerEmployee: number;

  @ApiProperty({ description: 'Average base salary', example: 2000 })
  avgBaseSalary: number;

  @ApiProperty({ description: 'Average allowances', example: 600 })
  avgAllowances: number;

  @ApiProperty({ description: 'Average deductions', example: 200 })
  avgDeductions: number;
}

/**
 * Complete site payroll report response
 */
export class PayrollBySiteResponseDto {
  @ApiProperty({
    type: [SitePayrollItemDto],
    description: 'Payroll breakdown by site',
  })
  sites: SitePayrollItemDto[];

  @ApiProperty({
    description: 'Total company payroll (all sites)',
    example: 600000,
  })
  totalPayroll: number;

  @ApiProperty({ description: 'Total number of employees', example: 250 })
  totalEmployees: number;

  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Month of report', example: 1 })
  month: number;

  @ApiProperty({ description: 'Year of report', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 4: SALARY COMPONENTS BREAKDOWN
 * ============================================================================
 */

/**
 * Allowance type breakdown item
 */
export class AllowanceTypeBreakdownDto {
  @ApiProperty({
    description: 'Allowance type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  allowanceTypeId: string;

  @ApiProperty({
    description: 'Allowance type name',
    example: 'Housing Allowance',
  })
  allowanceTypeName: string;

  @ApiPropertyOptional({ description: 'Name in Arabic', example: 'بدل السكن' })
  allowanceTypeNameAr?: string;

  @ApiProperty({
    description: 'Total amount for this allowance type',
    example: 50000,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Number of employees receiving this allowance',
    example: 120,
  })
  employeeCount: number;

  @ApiProperty({ description: 'Percentage of total allowances', example: 33.3 })
  percentageOfTotal: number;

  @ApiProperty({ description: 'Average amount per employee', example: 416.67 })
  avgPerEmployee: number;
}

/**
 * Deduction type breakdown item
 */
export class DeductionTypeBreakdownDto {
  @ApiProperty({
    description: 'Deduction type',
    example: 'LOAN_REPAYMENT',
    enum: [
      'LOAN_REPAYMENT',
      'INSURANCE',
      'TAX',
      'PENALTY',
      'ADVANCE_DEDUCTION',
      'ABSENCE',
      'OTHER',
    ],
  })
  deductionType: string;

  @ApiProperty({
    description: 'Human-readable deduction type name',
    example: 'Loan Repayment',
  })
  deductionTypeName: string;

  @ApiProperty({
    description: 'Total amount for this deduction type',
    example: 25000,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Number of employees with this deduction',
    example: 60,
  })
  employeeCount: number;

  @ApiProperty({ description: 'Percentage of total deductions', example: 50.0 })
  percentageOfTotal: number;

  @ApiProperty({ description: 'Average amount per employee', example: 416.67 })
  avgPerEmployee: number;
}

/**
 * Complete salary components breakdown response
 */
export class SalaryComponentsResponseDto {
  @ApiProperty({ description: 'Total base salaries', example: 500000 })
  totalBaseSalaries: number;

  @ApiProperty({ description: 'Total allowances', example: 150000 })
  totalAllowances: number;

  @ApiProperty({ description: 'Total deductions', example: 50000 })
  totalDeductions: number;

  @ApiProperty({ description: 'Net payroll', example: 600000 })
  netPayroll: number;

  @ApiProperty({ description: 'Base salaries percentage', example: 71.43 })
  baseSalariesPercentage: number;

  @ApiProperty({ description: 'Allowances percentage', example: 21.43 })
  allowancesPercentage: number;

  @ApiProperty({ description: 'Deductions percentage', example: 7.14 })
  deductionsPercentage: number;

  @ApiProperty({
    type: [AllowanceTypeBreakdownDto],
    description: 'Breakdown by allowance types',
  })
  allowanceTypes: AllowanceTypeBreakdownDto[];

  @ApiProperty({
    type: [DeductionTypeBreakdownDto],
    description: 'Breakdown by deduction types',
  })
  deductionTypes: DeductionTypeBreakdownDto[];

  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Month of report', example: 1 })
  month: number;

  @ApiProperty({ description: 'Year of report', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}
