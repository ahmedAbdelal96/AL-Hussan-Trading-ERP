import { ApiProperty } from '@nestjs/swagger';
import { EmploymentType, DeductionType, LoanStatus } from '@prisma/client';

/**
 * ============================================================================
 * PAYROLL STATISTICS DTOs
 * ============================================================================
 * Comprehensive data transfer objects for payroll analytics and reporting
 *
 * Design Decisions:
 * - All amounts are numbers (converted from Prisma Decimal for JSON serialization)
 * - Percentage calculations included for easy visualization
 * - Breakdown DTOs follow consistent structure for charting
 * - Time-based data uses human-readable month names
 * - Currency metadata included for internationalization
 *
 * @version 1.0.0
 * @author ERP System
 */

// ============================================================================
// BREAKDOWN DTOs - Used for chart data
// ============================================================================

/**
 * Employment Type Distribution
 * Shows salary distribution across employment types (Permanent, Contract, etc.)
 */
export class EmploymentTypeBreakdownDto {
  @ApiProperty({
    description: 'Employment type',
    enum: EmploymentType,
    example: 'PERMANENT',
  })
  employmentType: EmploymentType;

  @ApiProperty({
    description: 'Number of employees',
    example: 45,
  })
  employeeCount: number;

  @ApiProperty({
    description: 'Total salary amount for this type',
    example: 450000.0,
  })
  totalSalary: number;

  @ApiProperty({
    description: 'Average salary per employee',
    example: 10000.0,
  })
  averageSalary: number;

  @ApiProperty({
    description: 'Percentage of total payroll',
    example: 65.5,
  })
  percentage: number;
}

/**
 * Department-wise Salary Distribution
 * Shows how payroll is distributed across departments
 */
export class DepartmentBreakdownDto {
  @ApiProperty({
    description: 'Department name',
    example: 'Engineering',
  })
  department: string;

  @ApiProperty({
    description: 'Number of employees in department',
    example: 25,
  })
  employeeCount: number;

  @ApiProperty({
    description: 'Total salary for department',
    example: 250000.0,
  })
  totalSalary: number;

  @ApiProperty({
    description: 'Average salary in department',
    example: 10000.0,
  })
  averageSalary: number;

  @ApiProperty({
    description: 'Percentage of total payroll',
    example: 35.5,
  })
  percentage: number;
}

/**
 * Allowance Type Distribution
 * Shows breakdown of allowances by type
 */
export class AllowanceStatBreakdownDto {
  @ApiProperty({
    description: 'Allowance type ID',
    example: 'abc-123',
  })
  allowanceTypeId: string;

  @ApiProperty({
    description: 'Allowance type name',
    example: 'Transportation',
  })
  allowanceTypeName: string;

  @ApiProperty({
    description: 'Number of employees receiving this allowance',
    example: 30,
  })
  employeeCount: number;

  @ApiProperty({
    description: 'Total amount for this allowance type',
    example: 15000.0,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Average allowance per employee',
    example: 500.0,
  })
  averageAmount: number;

  @ApiProperty({
    description: 'Percentage of total allowances',
    example: 25.5,
  })
  percentage: number;
}

/**
 * Deduction Type Distribution
 * Shows breakdown of deductions by type
 */
export class DeductionStatBreakdownDto {
  @ApiProperty({
    description: 'Deduction type',
    enum: DeductionType,
    example: 'INSURANCE',
  })
  deductionType: DeductionType;

  @ApiProperty({
    description: 'Number of employees with this deduction',
    example: 50,
  })
  employeeCount: number;

  @ApiProperty({
    description: 'Total deduction amount',
    example: 25000.0,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Average deduction per employee',
    example: 500.0,
  })
  averageAmount: number;

  @ApiProperty({
    description: 'Percentage of total deductions',
    example: 40.0,
  })
  percentage: number;
}

/**
 * Loan Status Distribution
 * Shows breakdown of loans by status
 */
export class LoanStatusBreakdownDto {
  @ApiProperty({
    description: 'Loan status',
    enum: LoanStatus,
    example: 'APPROVED',
  })
  status: LoanStatus;

  @ApiProperty({
    description: 'Number of loans in this status',
    example: 15,
  })
  loanCount: number;

  @ApiProperty({
    description: 'Total loan amount',
    example: 150000.0,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Total remaining amount to be paid',
    example: 75000.0,
  })
  remainingAmount: number;

  @ApiProperty({
    description: 'Percentage of total loans',
    example: 30.0,
  })
  percentage: number;
}

// ============================================================================
// TREND DTOs - Used for time-series data
// ============================================================================

/**
 * Monthly Payroll Trend
 * Shows payroll evolution over time (last N months)
 */
export class MonthlyPayrollTrendDto {
  @ApiProperty({
    description: 'Month label (e.g., "Jan 2026")',
    example: 'Jan 2026',
  })
  month: string;

  @ApiProperty({
    description: 'Total payroll for the month',
    example: 500000.0,
  })
  totalPayroll: number;

  @ApiProperty({
    description: 'Total base salaries',
    example: 400000.0,
  })
  baseSalaries: number;

  @ApiProperty({
    description: 'Total allowances',
    example: 80000.0,
  })
  totalAllowances: number;

  @ApiProperty({
    description: 'Total deductions',
    example: 60000.0,
  })
  totalDeductions: number;

  @ApiProperty({
    description: 'Net payroll (base + allowances - deductions)',
    example: 420000.0,
  })
  netPayroll: number;

  @ApiProperty({
    description: 'Number of active employees',
    example: 50,
  })
  employeeCount: number;
}

// ============================================================================
// TOP EMPLOYEE DTO
// ============================================================================

/**
 * Top Earning Employees
 * Shows employees with highest total compensation
 */
export class TopEmployeeDto {
  @ApiProperty({
    description: 'Employee ID',
    example: 'emp-123',
  })
  employeeId: string;

  @ApiProperty({
    description: 'Employee name',
    example: 'Ahmed Ali',
  })
  employeeName: string;

  @ApiProperty({
    description: 'Employee number',
    example: 'EMP-001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: 'Department',
    example: 'Engineering',
  })
  department: string;

  @ApiProperty({
    description: 'Employment type',
    enum: EmploymentType,
    example: 'PERMANENT',
  })
  employmentType: EmploymentType;

  @ApiProperty({
    description: 'Base salary',
    example: 15000.0,
  })
  baseSalary: number;

  @ApiProperty({
    description: 'Total allowances',
    example: 3000.0,
  })
  totalAllowances: number;

  @ApiProperty({
    description: 'Total compensation (salary + allowances)',
    example: 18000.0,
  })
  totalCompensation: number;
}

// ============================================================================
// MAIN STATISTICS DTO
// ============================================================================

/**
 * Complete Payroll Statistics
 * Aggregates all payroll metrics and analytics
 *
 * Performance Notes:
 * - All calculations done in a single database round-trip where possible
 * - Percentage calculations performed in-memory for efficiency
 * - Uses efficient aggregation queries with proper indexing
 */
export class PayrollStatisticsDto {
  // ========== OVERVIEW METRICS ==========

  @ApiProperty({
    description: 'Total monthly base salary for all active employees',
    example: 500000.0,
  })
  totalBaseSalary: number;

  @ApiProperty({
    description: 'Total active monthly allowances',
    example: 75000.0,
  })
  totalAllowances: number;

  @ApiProperty({
    description: 'Total monthly deductions',
    example: 50000.0,
  })
  totalDeductions: number;

  @ApiProperty({
    description: 'Net monthly payroll (base + allowances - deductions)',
    example: 525000.0,
  })
  netPayroll: number;

  @ApiProperty({
    description: 'Total active employees',
    example: 50,
  })
  totalEmployees: number;

  @ApiProperty({
    description: 'Average salary per employee',
    example: 10500.0,
  })
  averageSalary: number;

  @ApiProperty({
    description: 'Number of active loans',
    example: 15,
  })
  activeLoanCount: number;

  @ApiProperty({
    description: 'Total outstanding loan amount',
    example: 200000.0,
  })
  totalLoanAmount: number;

  @ApiProperty({
    description: 'Total remaining loan balance',
    example: 150000.0,
  })
  remainingLoanBalance: number;

  // ========== BREAKDOWNS ==========

  @ApiProperty({
    description: 'Salary distribution by employment type',
    type: [EmploymentTypeBreakdownDto],
  })
  employmentTypeBreakdown: EmploymentTypeBreakdownDto[];

  @ApiProperty({
    description: 'Salary distribution by department',
    type: [DepartmentBreakdownDto],
  })
  departmentBreakdown: DepartmentBreakdownDto[];

  @ApiProperty({
    description: 'Allowances breakdown by type',
    type: [AllowanceStatBreakdownDto],
  })
  allowanceBreakdown: AllowanceStatBreakdownDto[];

  @ApiProperty({
    description: 'Deductions breakdown by type',
    type: [DeductionStatBreakdownDto],
  })
  deductionBreakdown: DeductionStatBreakdownDto[];

  @ApiProperty({
    description: 'Loans breakdown by status',
    type: [LoanStatusBreakdownDto],
  })
  loanStatusBreakdown: LoanStatusBreakdownDto[];

  // ========== TRENDS ==========

  @ApiProperty({
    description: 'Monthly payroll trend (last 6 months)',
    type: [MonthlyPayrollTrendDto],
  })
  monthlyTrend: MonthlyPayrollTrendDto[];

  @ApiProperty({
    description: 'Top 10 earning employees',
    type: [TopEmployeeDto],
  })
  topEmployees: TopEmployeeDto[];

  // ========== RECENT ACTIVITY ==========

  @ApiProperty({
    description: 'New employees hired in last 30 days',
    example: 5,
  })
  recentHires: number;

  @ApiProperty({
    description: 'Loans approved in last 30 days',
    example: 3,
  })
  recentLoanApprovals: number;

  @ApiProperty({
    description: 'Salary growth rate (compared to previous month)',
    example: 5.5,
  })
  growthRate: number;

  // ========== METADATA ==========

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Timestamp when statistics were calculated',
    example: '2026-01-18T10:30:00Z',
  })
  calculatedAt: Date;
}
