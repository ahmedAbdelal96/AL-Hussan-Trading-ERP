import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an employee loan
 */
export class UpdateEmployeeLoanDto {
  @ApiPropertyOptional({
    description: 'Loan amount',
    example: 12000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Number of installments',
    example: 18,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  installments?: number;

  @ApiPropertyOptional({
    description: 'Loan start date (ISO 8601 format)',
    example: '2024-02-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Loan end date (ISO 8601 format)',
    example: '2025-07-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Loan purpose',
    example: 'Medical emergency',
  })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Installments adjusted due to salary increase',
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
