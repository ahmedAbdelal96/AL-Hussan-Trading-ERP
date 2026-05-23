import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeductionType } from '@prisma/client';

/**
 * DTO for creating a new employee deduction
 */
export class CreateEmployeeDeductionDto {
  @ApiProperty({
    description: 'Employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Deduction type',
    example: 'INSURANCE',
    enum: DeductionType,
  })
  @IsEnum(DeductionType)
  @IsNotEmpty()
  deductionType: DeductionType;

  @ApiProperty({
    description: 'Deduction amount',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Deduction date (ISO 8601 format)',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsNotEmpty()
  deductionDate: string;

  @ApiPropertyOptional({
    description: 'Loan ID (required for LOAN_REPAYMENT type)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({
    description: 'Deduction reason',
    example: 'Health insurance premium',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Monthly insurance deduction',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Approved by user ID (for pre-approved deductions)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  approvedBy?: string;

  @ApiPropertyOptional({
    description: 'Approval date (ISO 8601 format)',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsOptional()
  approvedAt?: string;
}
