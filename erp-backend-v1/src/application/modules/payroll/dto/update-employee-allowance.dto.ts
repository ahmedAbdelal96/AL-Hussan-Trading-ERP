import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
  IsInt,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AllowanceFrequency } from '@prisma/client';

/**
 * DTO for updating an employee allowance
 */
export class UpdateEmployeeAllowanceDto {
  @ApiPropertyOptional({
    description: 'Allowance amount',
    example: 1200,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Allowance frequency',
    example: 'MONTHLY',
    enum: AllowanceFrequency,
  })
  @IsEnum(AllowanceFrequency)
  @IsOptional()
  frequency?: AllowanceFrequency;

  @ApiPropertyOptional({
    description: 'Effective from date (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({
    description: 'Effective to date (ISO 8601 format)',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Allowance adjustment',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Expected row version for optimistic concurrency control',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
