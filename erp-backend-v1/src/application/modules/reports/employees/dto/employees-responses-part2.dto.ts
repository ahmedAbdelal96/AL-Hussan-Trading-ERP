/**
 * ============================================================================
 * EMPLOYEES REPORTS - RESPONSE DTOs (PART 2)
 * ============================================================================
 *
 * Response structures for remaining 3 employee reports:
 * 5. Age & Experience Analysis
 * 6. Turnover Analysis
 * 7. Status Distribution
 *
 * @module EmployeesReportsResponses2
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';

/**
 * ============================================================================
 * REPORT 5: AGE & EXPERIENCE ANALYSIS
 * ============================================================================
 */

/**
 * Age group breakdown
 */
export class AgeGroupItemDto {
  @ApiProperty({ description: 'Age range', example: '26-35' })
  ageRange: string;

  @ApiProperty({ description: 'Employee count', example: 22 })
  employeeCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 44.0 })
  percentage: number;

  @ApiProperty({ description: 'Average age', example: 30.5 })
  avgAge: number;

  @ApiProperty({ description: 'Male count', example: 15 })
  maleCount: number;

  @ApiProperty({ description: 'Female count', example: 7 })
  femaleCount: number;
}

/**
 * Experience range breakdown
 */
export class ExperienceRangeItemDto {
  @ApiProperty({ description: 'Experience range (years)', example: '1-3' })
  experienceRange: string;

  @ApiProperty({ description: 'Employee count', example: 18 })
  employeeCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 36.0 })
  percentage: number;

  @ApiProperty({ description: 'Average tenure (years)', example: 2.1 })
  avgTenure: number;

  @ApiProperty({ description: 'Average age', example: 28.5 })
  avgAge: number;
}

/**
 * Department age/experience summary
 */
export class DepartmentAgeExperienceDto {
  @ApiProperty({ description: 'Department name', example: 'Engineering' })
  department: string;

  @ApiProperty({ description: 'Employee count', example: 15 })
  employeeCount: number;

  @ApiProperty({ description: 'Average age', example: 32.8 })
  avgAge: number;

  @ApiProperty({ description: 'Average tenure (years)', example: 3.5 })
  avgTenure: number;

  @ApiProperty({ description: 'Youngest employee age', example: 24 })
  minAge: number;

  @ApiProperty({ description: 'Oldest employee age', example: 45 })
  maxAge: number;
}

/**
 * Main age & experience report response
 */
export class AgeExperienceResponseDto {
  @ApiProperty({ type: [AgeGroupItemDto] })
  ageGroups: AgeGroupItemDto[];

  @ApiProperty({ type: [ExperienceRangeItemDto] })
  experienceRanges: ExperienceRangeItemDto[];

  @ApiProperty({ type: [DepartmentAgeExperienceDto] })
  departmentSummary: DepartmentAgeExperienceDto[];

  // === Overall Statistics ===
  @ApiProperty({ description: 'Total employees', example: 50 })
  totalEmployees: number;

  @ApiProperty({ description: 'Average age', example: 33.2 })
  avgAge: number;

  @ApiProperty({ description: 'Average tenure (years)', example: 3.1 })
  avgTenure: number;

  @ApiProperty({ description: 'Median age', example: 32.0 })
  medianAge: number;

  @ApiProperty({ description: 'Youngest employee age', example: 22 })
  minAge: number;

  @ApiProperty({ description: 'Oldest employee age', example: 58 })
  maxAge: number;

  @ApiProperty({ description: 'Employees under 30', example: 18 })
  under30Count: number;

  @ApiProperty({ description: 'Employees 30-45', example: 25 })
  age30to45Count: number;

  @ApiProperty({ description: 'Employees over 45', example: 7 })
  over45Count: number;

  // === Metadata ===
  @ApiPropertyOptional({ description: 'Month', example: 1 })
  month?: number;

  @ApiPropertyOptional({ description: 'Year', example: 2026 })
  year?: number;

  @ApiProperty({ description: 'Report generation date' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 6: TURNOVER ANALYSIS
 * ============================================================================
 */

/**
 * Monthly turnover data
 */
export class MonthlyTurnoverDto {
  @ApiProperty({ description: 'Month (YYYY-MM)', example: '2026-01' })
  month: string;

  @ApiProperty({ description: 'New hires', example: 5 })
  newHires: number;

  @ApiProperty({ description: 'Terminations', example: 2 })
  terminations: number;

  @ApiProperty({ description: 'Net change', example: 3 })
  netChange: number;

  @ApiProperty({ description: 'Total employees at month end', example: 50 })
  totalEmployees: number;

  @ApiProperty({ description: 'Turnover rate %', example: 4.0 })
  turnoverRate: number;
}

/**
 * Termination reason breakdown
 */
export class TerminationReasonDto {
  @ApiProperty({ description: 'Termination reason', example: 'Resignation' })
  reason: string;

  @ApiProperty({ description: 'Count', example: 5 })
  count: number;

  @ApiProperty({ description: 'Percentage', example: 41.67 })
  percentage: number;
}

/**
 * Department turnover summary
 */
export class DepartmentTurnoverDto {
  @ApiProperty({ description: 'Department name', example: 'Engineering' })
  department: string;

  @ApiProperty({ description: 'Total employees', example: 15 })
  totalEmployees: number;

  @ApiProperty({ description: 'Terminations', example: 2 })
  terminations: number;

  @ApiProperty({ description: 'Turnover rate %', example: 13.33 })
  turnoverRate: number;

  @ApiProperty({
    description: 'Average tenure of leavers (years)',
    example: 1.8,
  })
  avgTenureOfLeavers: number;
}

/**
 * Main turnover analysis response
 */
export class TurnoverAnalysisResponseDto {
  @ApiProperty({ type: [MonthlyTurnoverDto] })
  monthlyTrend: MonthlyTurnoverDto[];

  @ApiPropertyOptional({ type: [TerminationReasonDto] })
  terminationReasons?: TerminationReasonDto[];

  @ApiPropertyOptional({ type: [DepartmentTurnoverDto] })
  departmentTurnover?: DepartmentTurnoverDto[];

  // === Overall Metrics ===
  @ApiProperty({ description: 'Total new hires (period)', example: 25 })
  totalNewHires: number;

  @ApiProperty({ description: 'Total terminations (period)', example: 12 })
  totalTerminations: number;

  @ApiProperty({ description: 'Net workforce change', example: 13 })
  netChange: number;

  @ApiProperty({ description: 'Average monthly turnover rate %', example: 3.8 })
  avgTurnoverRate: number;

  @ApiProperty({ description: 'Highest monthly turnover %', example: 6.5 })
  maxTurnoverRate: number;

  @ApiProperty({ description: 'Lowest monthly turnover %', example: 2.0 })
  minTurnoverRate: number;

  @ApiProperty({
    description: 'Average tenure of terminated employees (years)',
    example: 2.3,
  })
  avgTenureOfTerminated: number;

  @ApiProperty({ description: 'Voluntary terminations %', example: 75.0 })
  voluntaryTerminationRate: number;

  // === Risk Assessment ===
  @ApiProperty({
    description: 'Is high risk (>10% avg turnover)',
    example: false,
  })
  isHighRisk: boolean;

  @ApiProperty({
    description: 'Risk level',
    enum: ['Low', 'Medium', 'High'],
    example: 'Low',
  })
  riskLevel: 'Low' | 'Medium' | 'High';

  // === Metadata ===
  @ApiProperty({ description: 'Analysis period (months)', example: 12 })
  periodMonths: number;

  @ApiProperty({ description: 'Report generation date' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 7: STATUS DISTRIBUTION
 * ============================================================================
 */

/**
 * Single status breakdown
 */
export class StatusItemDto {
  @ApiProperty({ enum: EmployeeStatus })
  status: EmployeeStatus;

  @ApiProperty({ description: 'Status name', example: 'Active' })
  statusName: string;

  @ApiProperty({ description: 'Status name (Arabic)', example: 'نشط' })
  statusNameAr: string;

  @ApiProperty({ description: 'Employee count', example: 45 })
  employeeCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 90.0 })
  percentage: number;

  @ApiProperty({ description: 'Male count', example: 28 })
  maleCount: number;

  @ApiProperty({ description: 'Female count', example: 17 })
  femaleCount: number;

  @ApiProperty({ description: 'Average tenure (years)', example: 3.5 })
  avgTenure: number;
}

/**
 * Historical status trend
 */
export class StatusTrendDto {
  @ApiProperty({ description: 'Month (YYYY-MM)', example: '2026-01' })
  month: string;

  @ApiProperty({ description: 'Active count', example: 45 })
  activeCount: number;

  @ApiProperty({ description: 'Inactive count', example: 3 })
  inactiveCount: number;

  @ApiProperty({ description: 'On leave count', example: 2 })
  onLeaveCount: number;

  @ApiProperty({ description: 'Suspended count', example: 0 })
  suspendedCount: number;

  @ApiProperty({ description: 'Total employees', example: 50 })
  totalEmployees: number;
}

/**
 * Main status distribution response
 */
export class StatusDistributionResponseDto {
  @ApiProperty({ type: [StatusItemDto] })
  statusBreakdown: StatusItemDto[];

  @ApiPropertyOptional({ type: [StatusTrendDto] })
  historicalTrend?: StatusTrendDto[];

  // === Overall Metrics ===
  @ApiProperty({ description: 'Total employees', example: 50 })
  totalEmployees: number;

  @ApiProperty({ description: 'Active percentage', example: 90.0 })
  activePercentage: number;

  @ApiProperty({ description: 'Inactive percentage', example: 6.0 })
  inactivePercentage: number;

  @ApiProperty({ description: 'On leave percentage', example: 4.0 })
  onLeavePercentage: number;

  @ApiProperty({
    description: 'Availability rate (active/total)',
    example: 90.0,
  })
  availabilityRate: number;

  // === Metadata ===
  @ApiPropertyOptional({ description: 'Month', example: 1 })
  month?: number;

  @ApiPropertyOptional({ description: 'Year', example: 2026 })
  year?: number;

  @ApiProperty({ description: 'Report generation date' })
  generatedAt: Date;
}
