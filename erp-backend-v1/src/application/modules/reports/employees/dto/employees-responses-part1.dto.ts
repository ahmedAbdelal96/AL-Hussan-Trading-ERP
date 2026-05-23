/**
 * ============================================================================
 * EMPLOYEES REPORTS - RESPONSE DTOs (PART 1)
 * ============================================================================
 *
 * Response structures for first 4 employee reports:
 * 1. Employees Overview
 * 2. Employees By Department
 * 3. Employees By Employment Type
 * 4. Employees By Position
 *
 * Design Principles:
 * - Comprehensive data structure
 * - Swagger documentation for API clarity
 * - Type safety with enums
 * - Optional fields for flexibility
 * - Nested DTOs for complex data
 *
 * @module EmployeesReportsResponses1
 * @version 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';
import { PaginationMeta } from '../../dto/common/report-response.dto';

/**
 * ============================================================================
 * REPORT 1: EMPLOYEES OVERVIEW
 * ============================================================================
 */

/**
 * Previous period comparison data
 */
export class PreviousPeriodDataDto {
  @ApiProperty({
    description: 'Total employees in previous period',
    example: 45,
  })
  totalEmployees: number;

  @ApiProperty({
    description: 'Active employees in previous period',
    example: 40,
  })
  activeEmployees: number;

  @ApiProperty({ description: 'New hires in previous period', example: 3 })
  newHires: number;

  @ApiProperty({ description: 'Terminations in previous period', example: 1 })
  terminations: number;

  @ApiProperty({
    description: 'Average tenure in previous period',
    example: 2.8,
  })
  avgTenure: number;
}

/**
 * Growth rate metrics
 */
export class GrowthRateDto {
  @ApiProperty({ description: 'Total employees growth rate %', example: 11.11 })
  totalEmployeesGrowth: number;

  @ApiProperty({ description: 'Active employees growth rate %', example: 12.5 })
  activeEmployeesGrowth: number;

  @ApiProperty({ description: 'New hires change %', example: 66.67 })
  newHiresChange: number;

  @ApiProperty({ description: 'Terminations change %', example: 100.0 })
  terminationsChange: number;
}

/**
 * Simple department summary
 */
export class SimpleDepartmentBreakdownDto {
  @ApiProperty({ description: 'Department name', example: 'Engineering' })
  department: string;

  @ApiProperty({ description: 'Employee count', example: 15 })
  employeeCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 30.0 })
  percentage: number;
}

/**
 * Main overview response
 */
export class EmployeesOverviewResponseDto {
  // === KPIs ===
  @ApiProperty({ description: 'Total employees', example: 50 })
  totalEmployees: number;

  @ApiProperty({ description: 'Active employees', example: 45 })
  activeEmployees: number;

  @ApiProperty({ description: 'Inactive employees', example: 3 })
  inactiveEmployees: number;

  @ApiProperty({ description: 'On leave employees', example: 2 })
  onLeaveEmployees: number;

  @ApiProperty({ description: 'Suspended employees', example: 0 })
  suspendedEmployees: number;

  @ApiProperty({ description: 'New hires (period)', example: 5 })
  newHires: number;

  @ApiProperty({ description: 'Terminations (period)', example: 2 })
  terminations: number;

  @ApiProperty({ description: 'Net change (new - terminations)', example: 3 })
  netChange: number;

  @ApiProperty({ description: 'Turnover rate %', example: 4.44 })
  turnoverRate: number;

  @ApiProperty({ description: 'Average tenure (years)', example: 3.2 })
  avgTenure: number;

  @ApiProperty({ description: 'Employees in probation', example: 4 })
  employeesInProbation: number;

  @ApiProperty({ description: 'Male count', example: 30 })
  maleCount: number;

  @ApiProperty({ description: 'Female count', example: 20 })
  femaleCount: number;

  @ApiProperty({ description: 'Gender diversity ratio', example: 0.67 })
  genderDiversityRatio: number;

  // === Optional Data ===
  @ApiPropertyOptional({ type: PreviousPeriodDataDto })
  previousPeriod?: PreviousPeriodDataDto;

  @ApiPropertyOptional({ type: GrowthRateDto })
  growthRate?: GrowthRateDto;

  @ApiPropertyOptional({ type: [SimpleDepartmentBreakdownDto] })
  departmentBreakdown?: SimpleDepartmentBreakdownDto[];

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
 * REPORT 2: EMPLOYEES BY DEPARTMENT
 * ============================================================================
 */

/**
 * Single department item with detailed metrics
 */
export class DepartmentItemDto {
  @ApiProperty({ description: 'Department name', example: 'Engineering' })
  department: string;

  @ApiProperty({ description: 'Total employees', example: 15 })
  employeeCount: number;

  @ApiProperty({ description: 'Active employees', example: 14 })
  activeCount: number;

  @ApiProperty({ description: 'Inactive employees', example: 1 })
  inactiveCount: number;

  @ApiProperty({ description: 'On leave employees', example: 0 })
  onLeaveCount: number;

  @ApiProperty({ description: 'Percentage of total workforce', example: 30.0 })
  percentage: number;

  @ApiProperty({ description: 'Average tenure (years)', example: 3.5 })
  avgTenure: number;

  @ApiProperty({ description: 'New hires (period)', example: 2 })
  newHires: number;

  @ApiProperty({ description: 'Terminations (period)', example: 0 })
  terminations: number;

  @ApiPropertyOptional({ description: 'Total salary costs', example: 150000 })
  totalSalaryCosts?: number;

  @ApiPropertyOptional({ description: 'Average salary', example: 10000 })
  avgSalary?: number;
}

/**
 * Main department report response
 */
export class EmployeesByDepartmentResponseDto {
  @ApiProperty({ type: [DepartmentItemDto] })
  departments: DepartmentItemDto[];

  @ApiProperty({ description: 'Total employees', example: 50 })
  totalEmployees: number;

  @ApiProperty({ description: 'Total departments', example: 5 })
  totalDepartments: number;

  @ApiProperty({
    description: 'Average employees per department',
    example: 10.0,
  })
  avgEmployeesPerDepartment: number;

  @ApiPropertyOptional({ description: 'Total salary costs', example: 500000 })
  totalSalaryCosts?: number;

  @ApiPropertyOptional({ description: 'Month', example: 1 })
  month?: number;

  @ApiPropertyOptional({ description: 'Year', example: 2026 })
  year?: number;

  @ApiPropertyOptional({ type: PaginationMeta })
  meta?: PaginationMeta;

  @ApiProperty({ description: 'Report generation date' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 3: EMPLOYEES BY EMPLOYMENT TYPE
 * ============================================================================
 */

/**
 * Single employment type breakdown
 */
export class EmploymentTypeItemDto {
  @ApiProperty({ enum: EmploymentType, example: EmploymentType.PERMANENT })
  employmentType: EmploymentType;

  @ApiProperty({ description: 'Employment type name', example: 'Permanent' })
  typeName: string;

  @ApiProperty({
    description: 'Employment type name (Arabic)',
    example: 'دائم',
  })
  typeNameAr: string;

  @ApiProperty({ description: 'Employee count', example: 35 })
  employeeCount: number;

  @ApiProperty({ description: 'Active count', example: 32 })
  activeCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 70.0 })
  percentage: number;

  @ApiProperty({ description: 'Average tenure (years)', example: 4.2 })
  avgTenure: number;
}

/**
 * Expiring contract item
 */
export class ExpiringContractDto {
  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ description: 'Employee number', example: 'EMP-0001' })
  employeeNumber: string;

  @ApiProperty({ description: 'Employee name', example: 'Ahmed Ali' })
  employeeName: string;

  @ApiProperty({ description: 'Department', example: 'Engineering' })
  department: string;

  @ApiProperty({ description: 'Position', example: 'Software Engineer' })
  position: string;

  @ApiProperty({ enum: EmploymentType })
  employmentType: EmploymentType;

  @ApiProperty({ description: 'Contract end date', example: '2026-03-15' })
  contractEndDate: string;

  @ApiProperty({ description: 'Days until expiry', example: 45 })
  daysUntilExpiry: number;

  @ApiProperty({ description: 'Is renewable', example: true })
  isRenewable: boolean;
}

/**
 * Main employment type report response
 */
export class EmployeesByEmploymentTypeResponseDto {
  @ApiProperty({ type: [EmploymentTypeItemDto] })
  employmentTypes: EmploymentTypeItemDto[];

  @ApiPropertyOptional({ type: [ExpiringContractDto] })
  expiringContracts?: ExpiringContractDto[];

  @ApiProperty({ description: 'Total employees', example: 50 })
  totalEmployees: number;

  @ApiProperty({ description: 'Permanent count', example: 35 })
  permanentCount: number;

  @ApiProperty({ description: 'Contract count', example: 10 })
  contractCount: number;

  @ApiProperty({ description: 'Freelance count', example: 3 })
  freelanceCount: number;

  @ApiProperty({ description: 'Part-time count', example: 2 })
  partTimeCount: number;

  @ApiPropertyOptional({ description: 'Expiring contracts count', example: 5 })
  expiringContractsCount?: number;

  @ApiPropertyOptional({ description: 'Month', example: 1 })
  month?: number;

  @ApiPropertyOptional({ description: 'Year', example: 2026 })
  year?: number;

  @ApiPropertyOptional({ type: PaginationMeta })
  meta?: PaginationMeta;

  @ApiProperty({ description: 'Report generation date' })
  generatedAt: Date;
}

/**
 * ============================================================================
 * REPORT 4: EMPLOYEES BY POSITION
 * ============================================================================
 */

/**
 * Single position breakdown
 */
export class PositionItemDto {
  @ApiProperty({ description: 'Position title', example: 'Software Engineer' })
  position: string;

  @ApiProperty({ description: 'Employee count', example: 8 })
  employeeCount: number;

  @ApiProperty({ description: 'Active count', example: 7 })
  activeCount: number;

  @ApiProperty({ description: 'Percentage of total', example: 16.0 })
  percentage: number;

  @ApiProperty({ description: 'Average tenure (years)', example: 2.8 })
  avgTenure: number;

  @ApiProperty({ description: 'Average age', example: 32.5 })
  avgAge: number;

  @ApiProperty({ description: 'New hires (period)', example: 1 })
  newHires: number;
}

/**
 * Main position report response
 */
export class EmployeesByPositionResponseDto {
  @ApiProperty({ type: [PositionItemDto] })
  positions: PositionItemDto[];

  @ApiProperty({ description: 'Total employees', example: 50 })
  totalEmployees: number;

  @ApiProperty({ description: 'Total positions', example: 12 })
  totalPositions: number;

  @ApiProperty({ description: 'Average employees per position', example: 4.17 })
  avgEmployeesPerPosition: number;

  @ApiPropertyOptional({ description: 'Month', example: 1 })
  month?: number;

  @ApiPropertyOptional({ description: 'Year', example: 2026 })
  year?: number;

  @ApiPropertyOptional({ type: PaginationMeta })
  meta?: PaginationMeta;

  @ApiProperty({ description: 'Report generation date' })
  generatedAt: Date;
}
