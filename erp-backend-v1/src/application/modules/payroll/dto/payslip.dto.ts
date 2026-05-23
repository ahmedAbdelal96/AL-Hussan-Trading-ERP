/**
 * Payslip DTOs - Data Transfer Objects
 *
 * DTOs for payslip (salary slip) generation and retrieval.
 * Handles monthly payroll processing with comprehensive salary breakdowns.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsInt,
  IsOptional,
  IsBoolean,
  IsString,
  IsDateString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Prisma } from '@prisma/client';

/**
 * DTO for processing monthly payroll
 * Generates payslips for all active employees for a given period
 */
export class ProcessPayrollDto {
  @ApiProperty({
    description: 'Month for payroll processing (1-12)',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  payPeriodMonth: number;

  @ApiProperty({
    description: 'Year for payroll processing',
    example: 2024,
    minimum: 2000,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  payPeriodYear: number;

  @ApiPropertyOptional({
    description: 'Payment date (defaults to last day of period)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  payDate?: string;

  @ApiPropertyOptional({
    description: 'Process only for specific employees (optional)',
    type: [String],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  employeeIds?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes for this payroll batch',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for updating payslip payment status
 */
export class UpdatePayslipPaymentDto {
  @ApiProperty({
    description: 'Mark as paid',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isPaid: boolean;

  @ApiPropertyOptional({
    description: 'Payment date',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'BANK_TRANSFER',
    enum: ['BANK_TRANSFER', 'CASH', 'CHECK'],
  })
  @IsOptional()
  @IsEnum(['BANK_TRANSFER', 'CASH', 'CHECK'])
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Payment notes',
  })
  @IsOptional()
  @IsString()
  paymentNotes?: string;
}

/**
 * DTO for filtering payslips
 */
export class PayslipFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by employee ID',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by month (1-12)',
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  payPeriodMonth?: number;

  @ApiPropertyOptional({
    description: 'Filter by year',
    minimum: 2000,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  payPeriodYear?: number;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  isPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by department',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'payDate',
    enum: ['payDate', 'netSalary', 'grossSalary', 'employeeNumber'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

/**
 * Payslip response entity
 */
export class PayslipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  payPeriodMonth: number;

  @ApiProperty()
  payPeriodYear: number;

  @ApiProperty()
  payDate: Date;

  // Salary components
  @ApiProperty()
  baseSalary: Prisma.Decimal;

  @ApiProperty()
  housingAllowance: Prisma.Decimal;

  @ApiProperty()
  transportAllowance: Prisma.Decimal;

  @ApiProperty()
  foodAllowance: Prisma.Decimal;

  @ApiProperty()
  otherAllowances: Prisma.Decimal;

  @ApiProperty()
  totalAllowances: Prisma.Decimal;

  @ApiProperty()
  grossSalary: Prisma.Decimal;

  // Deductions
  @ApiProperty()
  insuranceDeduction: Prisma.Decimal;

  @ApiProperty()
  taxDeduction: Prisma.Decimal;

  @ApiProperty()
  loanDeduction: Prisma.Decimal;

  @ApiProperty()
  absenceDeduction: Prisma.Decimal;

  @ApiProperty()
  otherDeductions: Prisma.Decimal;

  @ApiProperty()
  totalDeductions: Prisma.Decimal;

  @ApiProperty()
  netSalary: Prisma.Decimal;

  // Working info
  @ApiProperty()
  workingDays: number;

  @ApiProperty()
  absentDays: number;

  @ApiProperty()
  overtimeHours: Prisma.Decimal;

  @ApiProperty()
  overtimeAmount: Prisma.Decimal;

  // Payment status
  @ApiProperty()
  isPaid: boolean;

  @ApiPropertyOptional()
  paidAt?: Date | null;

  @ApiPropertyOptional()
  paidBy?: string | null;

  @ApiPropertyOptional()
  payMethod?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  paymentNotes?: string | null;

  @ApiProperty()
  processedAt: Date;

  @ApiProperty()
  processedBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiPropertyOptional()
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: { nameEn: string; nameAr: string } | null;
    position: { nameEn: string } | null;
  };
}

/**
 * Response for payroll processing operation
 */
export class ProcessPayrollResponseDto {
  @ApiProperty({
    description: 'Total number of payslips generated',
    example: 150,
  })
  totalProcessed: number;

  @ApiProperty({
    description: 'Number of successful payslips',
    example: 148,
  })
  successful: number;

  @ApiProperty({
    description: 'Number of failed payslips',
    example: 2,
  })
  failed: number;

  @ApiProperty({
    description: 'Total gross salary amount',
    example: 500000.0,
  })
  totalGrossSalary: number;

  @ApiProperty({
    description: 'Total deductions amount',
    example: 75000.0,
  })
  totalDeductions: number;

  @ApiProperty({
    description: 'Total net salary amount',
    example: 425000.0,
  })
  totalNetSalary: number;

  @ApiProperty({
    description: 'Generated payslips',
    type: [PayslipResponseDto],
  })
  payslips: PayslipResponseDto[];

  @ApiPropertyOptional({
    description: 'Errors encountered during processing',
    type: [Object],
  })
  errors?: {
    employeeId: string;
    employeeName: string;
    error: string;
  }[];
}

/**
 * Paginated payslips response
 */
export class PaginatedPayslipsDto {
  @ApiProperty({ type: [PayslipResponseDto] })
  data: PayslipResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional({
    description: 'Count of paid payslips (server-side aggregate)',
  })
  paidCount?: number;

  @ApiPropertyOptional({
    description: 'Count of unpaid payslips (server-side aggregate)',
  })
  unpaidCount?: number;

  @ApiPropertyOptional({
    description: 'Total net salary amount across all matching payslips',
  })
  totalNetAmount?: number;
}

/**
 * Payslip list statistics response
 * Used by list KPI cards and intentionally independent from pagination.
 */
export class PayslipStatisticsDto {
  @ApiProperty({
    description: 'Total matching payslips',
    example: 125,
  })
  total: number;

  @ApiProperty({
    description: 'Count of paid payslips',
    example: 80,
  })
  paidCount: number;

  @ApiProperty({
    description: 'Count of unpaid payslips',
    example: 45,
  })
  unpaidCount: number;

  @ApiProperty({
    description: 'Total net salary amount across all matching payslips',
    example: 2450000,
  })
  totalNetAmount: number;
}
