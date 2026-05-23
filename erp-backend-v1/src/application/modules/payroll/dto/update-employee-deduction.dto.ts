import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsInt,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an employee deduction
 */
export class UpdateEmployeeDeductionDto {
  @ApiPropertyOptional({
    description: 'Deduction amount',
    example: 550,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Deduction date (ISO 8601 format)',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsOptional()
  deductionDate?: string;

  @ApiPropertyOptional({
    description: 'Deduction reason',
    example: 'Updated health insurance premium',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Amount adjusted due to policy change',
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
