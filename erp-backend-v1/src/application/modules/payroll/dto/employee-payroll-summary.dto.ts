import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AllowanceFrequency, DeductionType } from '@prisma/client';

/**
 * Allowance breakdown item
 */
export class AllowanceBreakdownDto {
  @ApiProperty({ example: 'Housing Allowance' })
  allowanceType: string;

  @ApiProperty({ example: 1000 })
  amount: number;

  @ApiProperty({ example: 'MONTHLY', enum: AllowanceFrequency })
  frequency: AllowanceFrequency;
}

/**
 * Deduction breakdown item
 */
export class DeductionBreakdownDto {
  @ApiProperty({ example: 'INSURANCE', enum: DeductionType })
  deductionType: DeductionType;

  @ApiProperty({ example: 500 })
  amount: number;
}

/**
 * Response DTO for employee payroll summary
 */
export class EmployeePayrollSummaryDto {
  @ApiProperty({
    description: 'Employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  employeeId: string;

  @ApiProperty({
    description: 'Base salary amount',
    example: 5000,
  })
  baseSalary: number;

  @ApiProperty({
    description: 'Total allowances amount',
    example: 2000,
  })
  totalAllowances: number;

  @ApiProperty({
    description: 'Breakdown of allowances',
    type: [AllowanceBreakdownDto],
  })
  allowanceBreakdown: AllowanceBreakdownDto[];

  @ApiProperty({
    description: 'Total deductions amount',
    example: 1000,
  })
  totalDeductions: number;

  @ApiProperty({
    description: 'Breakdown of deductions',
    type: [DeductionBreakdownDto],
  })
  deductionBreakdown: DeductionBreakdownDto[];

  @ApiProperty({
    description: 'Net salary (baseSalary + totalAllowances - totalDeductions)',
    example: 6000,
  })
  netSalary: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'SAR',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Summary period start date',
    example: '2024-01-01T00:00:00Z',
  })
  periodStart?: Date;

  @ApiPropertyOptional({
    description: 'Summary period end date',
    example: '2024-01-31T23:59:59Z',
  })
  periodEnd?: Date;
}
