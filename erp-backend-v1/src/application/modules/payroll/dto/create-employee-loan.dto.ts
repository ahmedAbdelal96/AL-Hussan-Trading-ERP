import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new employee loan
 */
export class CreateEmployeeLoanDto {
  @ApiProperty({
    description: 'Employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Loan amount',
    example: 10000,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Number of installments',
    example: 12,
    minimum: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  installments: number;

  @ApiProperty({
    description: 'Loan start date (ISO 8601 format)',
    example: '2024-02-01',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({
    description:
      'Loan end date (ISO 8601 format, calculated from start date + installments if not provided)',
    example: '2025-01-31',
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
    example: 'Emergency loan for medical expenses',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
