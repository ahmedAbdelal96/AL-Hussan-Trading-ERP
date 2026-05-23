/**
 * ============================================================================
 * PAYROLL REPORTS - RESPONSE DTOs (Part 2: Reports 5-8)
 * ============================================================================
 *
 * Continuation of response DTOs for remaining payroll reports.
 *
 * @module PayrollReportsResponses
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ============================================================================
 * REPORT 5: ALLOWANCES REPORT
 * ============================================================================
 */

/**
 * Single allowance summary item
 */
export class AllowanceSummaryItemDto {
  @ApiProperty({
    description: 'Allowance type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  allowanceTypeId: string;

  @ApiProperty({
    description: 'Allowance type name',
    example: 'Transportation Allowance',
  })
  allowanceTypeName: string;

  @ApiPropertyOptional({
    description: 'Name in Arabic',
    example: 'بدل المواصلات',
  })
  allowanceTypeNameAr?: string;

  @ApiProperty({ description: 'Total monthly amount', example: 30000 })
  totalMonthlyAmount: number;

  @ApiProperty({ description: 'Number of active allowances', example: 100 })
  activeCount: number;

  @ApiProperty({ description: 'Number of inactive allowances', example: 5 })
  inactiveCount: number;

  @ApiProperty({ description: 'Number of pending approvals', example: 3 })
  pendingCount: number;

  @ApiProperty({ description: 'Average amount per employee', example: 300 })
  avgAmount: number;

  @ApiProperty({ description: 'Minimum amount', example: 200 })
  minAmount: number;

  @ApiProperty({ description: 'Maximum amount', example: 500 })
  maxAmount: number;

  @ApiProperty({ description: 'Percentage of total allowances', example: 20.0 })
  percentageOfTotal: number;
}

/**
 * Allowances by frequency breakdown
 */
export class AllowancesByFrequencyDto {
  @ApiProperty({
    description: 'Allowance frequency',
    example: 'MONTHLY',
    enum: ['ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'],
  })
  frequency: string;

  @ApiProperty({
    description: 'Total amount for this frequency',
    example: 100000,
  })
  totalAmount: number;

  @ApiProperty({ description: 'Number of allowances', example: 150 })
  count: number;

  @ApiProperty({ description: 'Percentage of total', example: 66.67 })
  percentageOfTotal: number;
}

/**
 * Complete allowances report response
 */
export class AllowancesReportResponseDto {
  @ApiProperty({ description: 'Total allowances amount', example: 150000 })
  totalAmount: number;

  @ApiProperty({
    description: 'Total number of active allowances',
    example: 200,
  })
  totalActive: number;

  @ApiProperty({
    description: 'Total number of inactive allowances',
    example: 10,
  })
  totalInactive: number;

  @ApiProperty({ description: 'Number of pending approvals', example: 5 })
  totalPending: number;

  @ApiProperty({
    type: [AllowanceSummaryItemDto],
    description: 'Breakdown by allowance type',
  })
  byAllowanceType: AllowanceSummaryItemDto[];

  @ApiProperty({
    type: [AllowancesByFrequencyDto],
    description: 'Breakdown by frequency',
  })
  byFrequency: AllowancesByFrequencyDto[];

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
 * REPORT 6: DEDUCTIONS & LOANS REPORT
 * ============================================================================
 */

/**
 * Loans summary statistics
 */
export class LoansSummaryDto {
  @ApiProperty({
    description: 'Total outstanding loan amount',
    example: 200000,
  })
  totalOutstanding: number;

  @ApiProperty({
    description: 'Total amount paid this month (installments)',
    example: 15000,
  })
  totalPaidThisMonth: number;

  @ApiProperty({ description: 'Number of active loans', example: 40 })
  activeLoanCount: number;

  @ApiProperty({
    description: 'Number of pending loan applications',
    example: 5,
  })
  pendingLoanCount: number;

  @ApiProperty({ description: 'Number of paid-off loans', example: 15 })
  paidOffCount: number;

  @ApiProperty({ description: 'Number of overdue/defaulted loans', example: 2 })
  overdueCount: number;

  @ApiProperty({ description: 'Average loan amount', example: 5000 })
  avgLoanAmount: number;

  @ApiProperty({ description: 'Average remaining balance', example: 3000 })
  avgRemainingBalance: number;
}

/**
 * Loans by status breakdown
 */
export class LoansByStatusDto {
  @ApiProperty({
    description: 'Loan status',
    example: 'ACTIVE',
    enum: [
      'PENDING',
      'APPROVED',
      'ACTIVE',
      'PAID_OFF',
      'REJECTED',
      'DEFAULTED',
    ],
  })
  status: string;

  @ApiProperty({ description: 'Status display name', example: 'Active' })
  statusName: string;

  @ApiProperty({ description: 'Number of loans', example: 40 })
  count: number;

  @ApiProperty({ description: 'Total amount', example: 150000 })
  totalAmount: number;

  @ApiProperty({ description: 'Total remaining balance', example: 120000 })
  totalRemaining: number;

  @ApiProperty({ description: 'Percentage of total loans', example: 75.0 })
  percentageOfTotal: number;
}

/**
 * Deduction type summary for deductions report
 */
export class DeductionSummaryItemDto {
  @ApiProperty({
    description: 'Deduction type',
    example: 'INSURANCE',
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
    description: 'Deduction type display name',
    example: 'Insurance',
  })
  deductionTypeName: string;

  @ApiProperty({
    description: 'Total amount deducted this month',
    example: 10000,
  })
  totalAmount: number;

  @ApiProperty({ description: 'Number of employees affected', example: 50 })
  employeeCount: number;

  @ApiProperty({ description: 'Percentage of total deductions', example: 20.0 })
  percentageOfTotal: number;

  @ApiProperty({ description: 'Average deduction per employee', example: 200 })
  avgAmount: number;
}

/**
 * Complete deductions & loans report response
 */
export class DeductionsLoansReportResponseDto {
  @ApiProperty({
    type: LoansSummaryDto,
    description: 'Loans summary statistics',
  })
  loansSummary: LoansSummaryDto;

  @ApiProperty({
    type: [LoansByStatusDto],
    description: 'Loans breakdown by status',
  })
  loansByStatus: LoansByStatusDto[];

  @ApiProperty({
    description: 'Total deductions amount this month',
    example: 50000,
  })
  totalDeductions: number;

  @ApiProperty({
    type: [DeductionSummaryItemDto],
    description: 'Deductions breakdown by type',
  })
  deductionsByType: DeductionSummaryItemDto[];

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
 * REPORT 7: PAYROLL TREND (12 MONTHS)
 * ============================================================================
 */

/**
 * Monthly data point for payroll trend
 */
export class MonthlyPayrollDataPointDto {
  @ApiProperty({ description: 'Month key (YYYY-MM)', example: '2026-01' })
  month: string;

  @ApiProperty({ description: 'Month display name', example: 'Jan 2026' })
  monthName: string;

  @ApiProperty({ description: 'Total base salaries', example: 500000 })
  totalBaseSalaries: number;

  @ApiProperty({ description: 'Total allowances', example: 150000 })
  totalAllowances: number;

  @ApiProperty({ description: 'Total deductions', example: 50000 })
  totalDeductions: number;

  @ApiProperty({ description: 'Net payroll', example: 600000 })
  netPayroll: number;

  @ApiProperty({ description: 'Number of employees', example: 250 })
  employeeCount: number;

  @ApiProperty({ description: 'Average salary per employee', example: 2400 })
  avgSalaryPerEmployee: number;
}

/**
 * Complete payroll trend report response
 */
export class PayrollTrendResponseDto {
  @ApiProperty({
    type: [MonthlyPayrollDataPointDto],
    description: 'Monthly payroll data points',
  })
  data: MonthlyPayrollDataPointDto[];

  @ApiProperty({
    description: 'Total payroll across all months',
    example: 7200000,
  })
  totalPayroll: number;

  @ApiProperty({ description: 'Average monthly payroll', example: 600000 })
  avgMonthlyPayroll: number;

  @ApiProperty({ description: 'Highest monthly payroll', example: 650000 })
  highestPayroll: number;

  @ApiProperty({ description: 'Lowest monthly payroll', example: 550000 })
  lowestPayroll: number;

  @ApiProperty({
    description: 'Overall trend direction',
    example: 'up',
    enum: ['up', 'down', 'neutral'],
  })
  trend: 'up' | 'down' | 'neutral';

  @ApiProperty({
    description: 'Growth rate from first to last month (%)',
    example: 8.5,
  })
  overallGrowthRate: number;

  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Number of months in report', example: 12 })
  monthsCount: number;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 8: PAYROLL COMPARISON
 * ============================================================================
 */

/**
 * Payroll data for a single period (used in comparison)
 */
export class PeriodPayrollDataDto {
  @ApiProperty({ description: 'Month (1-12)', example: 1 })
  month: number;

  @ApiProperty({ description: 'Year', example: 2026 })
  year: number;

  @ApiProperty({ description: 'Period label', example: 'Jan 2026' })
  periodLabel: string;

  @ApiProperty({ description: 'Total base salaries', example: 500000 })
  totalBaseSalaries: number;

  @ApiProperty({ description: 'Total allowances', example: 150000 })
  totalAllowances: number;

  @ApiProperty({ description: 'Total deductions', example: 50000 })
  totalDeductions: number;

  @ApiProperty({ description: 'Net payroll', example: 600000 })
  netPayroll: number;

  @ApiProperty({ description: 'Employee count', example: 250 })
  employeeCount: number;

  @ApiProperty({ description: 'Average salary per employee', example: 2400 })
  avgSalaryPerEmployee: number;
}

/**
 * Variance between two periods
 */
export class PayrollVarianceDto {
  @ApiProperty({ description: 'Base salaries difference', example: 20000 })
  baseSalariesDiff: number;

  @ApiProperty({
    description: 'Base salaries change percentage',
    example: 4.17,
  })
  baseSalariesChangePercent: number;

  @ApiProperty({ description: 'Allowances difference', example: 5000 })
  allowancesDiff: number;

  @ApiProperty({ description: 'Allowances change percentage', example: 3.45 })
  allowancesChangePercent: number;

  @ApiProperty({ description: 'Deductions difference', example: 2000 })
  deductionsDiff: number;

  @ApiProperty({ description: 'Deductions change percentage', example: 4.17 })
  deductionsChangePercent: number;

  @ApiProperty({ description: 'Net payroll difference', example: 23000 })
  netPayrollDiff: number;

  @ApiProperty({ description: 'Net payroll change percentage', example: 3.98 })
  netPayrollChangePercent: number;

  @ApiProperty({ description: 'Employee count difference', example: 5 })
  employeeCountDiff: number;

  @ApiProperty({
    description: 'Employee count change percentage',
    example: 2.04,
  })
  employeeCountChangePercent: number;
}

/**
 * Employee-level changes between periods
 */
export class EmployeeChangesDto {
  @ApiProperty({ description: 'Number of new hires', example: 8 })
  newHires: number;

  @ApiProperty({
    description: 'Number of resignations/terminations',
    example: 3,
  })
  resignations: number;

  @ApiProperty({ description: 'Net employee change', example: 5 })
  netChange: number;

  @ApiProperty({
    description: 'Number of employees with salary increases',
    example: 12,
  })
  salaryIncreasesCount: number;

  @ApiProperty({
    description: 'Number of employees with salary decreases',
    example: 2,
  })
  salaryDecreasesCount: number;
}

/**
 * Complete payroll comparison report response
 */
export class PayrollComparisonResponseDto {
  @ApiProperty({ type: PeriodPayrollDataDto, description: 'First period data' })
  period1: PeriodPayrollDataDto;

  @ApiProperty({
    type: PeriodPayrollDataDto,
    description: 'Second period data',
  })
  period2: PeriodPayrollDataDto;

  @ApiProperty({ type: PayrollVarianceDto, description: 'Variance analysis' })
  variance: PayrollVarianceDto;

  @ApiPropertyOptional({
    type: EmployeeChangesDto,
    description: 'Employee-level changes',
  })
  employeeChanges?: EmployeeChangesDto;

  @ApiProperty({ description: 'Currency code', example: 'SAR' })
  currency: string;

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}
