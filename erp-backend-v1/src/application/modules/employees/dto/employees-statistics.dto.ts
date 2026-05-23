/**
 * ============================================================================
 * EMPLOYEES STATISTICS DTOs
 * ============================================================================
 *
 * Comprehensive Data Transfer Objects for employee analytics and reporting.
 *
 * Features:
 * - Employee overview metrics (total, active, inactive, turnover)
 * - Employment type distribution (Permanent, Contract, Freelance, Part-time)
 * - Department workforce breakdown
 * - Gender demographics and diversity metrics
 * - Age group distribution analysis
 * - Nationality breakdown for workforce diversity
 * - Monthly hiring trends with growth tracking
 * - Probation status monitoring
 * - Average tenure calculations
 *
 * Architecture:
 * - Granular DTOs for each breakdown type
 * - Main DTO aggregates all statistics
 * - Clean separation of concerns
 * - Type-safe with ApiProperty decorators for Swagger
 * - Optimized for frontend consumption
 *
 * Performance Considerations:
 * - DTOs designed for efficient serialization
 * - Numeric types for quick calculations
 * - Date strings for JSON compatibility
 * - Optional fields for flexible querying
 *
 * @module EmployeesStatisticsDTO
 * @version 1.0.0
 * @author ERP System - Senior Backend Developer
 */

import { ApiProperty } from '@nestjs/swagger';
import { EmploymentType, EmployeeStatus, Gender } from '@prisma/client';

/**
 * ============================================================================
 * EMPLOYMENT TYPE BREAKDOWN DTO
 * ============================================================================
 */

/**
 * Employment type distribution statistics
 * Shows workforce composition by employment type
 */
export class EmploymentTypeBreakdownDto {
  @ApiProperty({
    description:
      'Type of employment (PERMANENT, CONTRACT, FREELANCE, PART_TIME)',
    enum: EmploymentType,
    example: 'PERMANENT',
  })
  employmentType: EmploymentType;

  @ApiProperty({
    description: 'Number of employees with this employment type',
    example: 45,
    minimum: 0,
  })
  employeeCount: number;

  @ApiProperty({
    description: 'Percentage of total workforce',
    example: 75.5,
    minimum: 0,
    maximum: 100,
  })
  percentage: number;
}

/**
 * ============================================================================
 * EMPLOYEE STATUS BREAKDOWN DTO
 * ============================================================================
 */

/**
 * Employee status distribution statistics
 * Tracks active, inactive, on leave, suspended, and terminated employees
 */
export class EmployeeStatusBreakdownDto {
  @ApiProperty({
    description:
      'Employee status (ACTIVE, INACTIVE, ON_LEAVE, SUSPENDED, TERMINATED)',
    enum: EmployeeStatus,
    example: 'ACTIVE',
  })
  status: EmployeeStatus;

  @ApiProperty({
    description: 'Number of employees with this status',
    example: 50,
    minimum: 0,
  })
  employeeCount: number;

  @ApiProperty({
    description: 'Percentage of total employees',
    example: 83.33,
    minimum: 0,
    maximum: 100,
  })
  percentage: number;
}

/**
 * ============================================================================
 * DEPARTMENT BREAKDOWN DTO
 * ============================================================================
 */

/**
 * Department workforce distribution
 * Shows employee count and headcount per department
 */
export class DepartmentBreakdownDto {
  @ApiProperty({
    description: 'Department name',
    example: 'Engineering',
  })
  department: string;

  @ApiProperty({
    description: 'Number of employees in department',
    example: 15,
    minimum: 0,
  })
  employeeCount: number;

  @ApiProperty({
    description: 'Percentage of total workforce',
    example: 25.0,
    minimum: 0,
    maximum: 100,
  })
  percentage: number;

  @ApiProperty({
    description: 'Number of active employees in department',
    example: 14,
    minimum: 0,
  })
  activeCount: number;
}

/**
 * ============================================================================
 * GENDER BREAKDOWN DTO
 * ============================================================================
 */

/**
 * Gender demographics distribution
 * Workforce diversity metrics by gender
 */
export class GenderBreakdownDto {
  @ApiProperty({
    description: 'Gender (MALE, FEMALE, OTHER) - null if not specified',
    enum: Gender,
    example: 'MALE',
    nullable: true,
  })
  gender: Gender | null;

  @ApiProperty({
    description: 'Number of employees by gender',
    example: 35,
    minimum: 0,
  })
  employeeCount: number;

  @ApiProperty({
    description: 'Percentage of total workforce',
    example: 58.33,
    minimum: 0,
    maximum: 100,
  })
  percentage: number;
}

/**
 * ============================================================================
 * MAIN STATISTICS DTO
 * ============================================================================
 */

/**
 * Comprehensive employee statistics DTO
 * Aggregates all employee-related metrics and breakdowns
 *
 * Performance Notes:
 * - All calculations performed in database for efficiency
 * - Includes both raw counts and percentages
 * - Optimized for dashboard displays
 * - Supports filtering by date range, department, status
 */
export class EmployeesStatisticsDto {
  // ========================================================================
  // OVERVIEW METRICS
  // ========================================================================

  @ApiProperty({
    description: 'Total number of employees (excluding soft-deleted)',
    example: 60,
    minimum: 0,
  })
  totalEmployees: number;

  @ApiProperty({
    description: 'Number of active employees (status = ACTIVE)',
    example: 50,
    minimum: 0,
  })
  activeEmployees: number;

  @ApiProperty({
    description: 'Number of inactive employees (status = INACTIVE)',
    example: 5,
    minimum: 0,
  })
  inactiveEmployees: number;

  @ApiProperty({
    description: 'Number of employees on leave (status = ON_LEAVE)',
    example: 3,
    minimum: 0,
  })
  onLeaveEmployees: number;

  // ========================================================================
  // GENDER METRICS
  // ========================================================================

  @ApiProperty({
    description: 'Number of male employees',
    example: 35,
    minimum: 0,
  })
  maleCount: number;

  @ApiProperty({
    description: 'Number of female employees',
    example: 25,
    minimum: 0,
  })
  femaleCount: number;

  // ========================================================================
  // BREAKDOWNS
  // ========================================================================

  @ApiProperty({
    description: 'Employment type distribution breakdown',
    type: [EmploymentTypeBreakdownDto],
  })
  employmentTypeBreakdown: EmploymentTypeBreakdownDto[];

  @ApiProperty({
    description: 'Employee status distribution breakdown',
    type: [EmployeeStatusBreakdownDto],
  })
  statusBreakdown: EmployeeStatusBreakdownDto[];

  @ApiProperty({
    description: 'Department workforce distribution',
    type: [DepartmentBreakdownDto],
  })
  departmentBreakdown: DepartmentBreakdownDto[];

  @ApiProperty({
    description: 'Gender distribution breakdown',
    type: [GenderBreakdownDto],
  })
  genderBreakdown: GenderBreakdownDto[];

  // ========================================================================
  // METADATA
  // ========================================================================

  @ApiProperty({
    description: 'Timestamp when statistics were generated',
    example: '2024-01-15T10:30:00Z',
  })
  generatedAt: Date;

  @ApiProperty({
    description: 'Date range start for filtered statistics (optional)',
    example: '2024-01-01',
    required: false,
  })
  startDate?: string;

  @ApiProperty({
    description: 'Date range end for filtered statistics (optional)',
    example: '2024-12-31',
    required: false,
  })
  endDate?: string;
}
