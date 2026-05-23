import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for paying a loan installment
 */
export class PayLoanInstallmentDto {
  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Installment paid for January 2024',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Deduction date (ISO 8601 format, defaults to today)',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsOptional()
  deductionDate?: string;

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
