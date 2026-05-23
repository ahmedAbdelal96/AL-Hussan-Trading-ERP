/**
 * Update Salary DTO
 *
 * Data transfer object for updating employee salary with optimistic locking
 *
 * Business Rules:
 * - baseSalary must be positive
 * - version/rowVersion is required for optimistic locking (prevents concurrent update conflicts)
 * - reason is optional but recommended for audit trail
 *
 * @version 1.0
 * @author Senior Developer
 */

import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSalaryDto {
  @ApiProperty({
    description: 'New base salary amount (must be positive)',
    example: 7000.0,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Salary must be greater than zero' })
  @IsNotEmpty()
  baseSalary!: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'SAR',
    default: 'SAR',
    maxLength: 3,
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  @IsIn(['SAR'])
  currency?: string = 'SAR';

  @ApiPropertyOptional({
    description: 'Reason for salary change (for audit trail)',
    example: 'Annual performance raise',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    description:
      'Current row version (for optimistic locking). Must match database version to prevent concurrent update conflicts.',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;

  @ApiPropertyOptional({
    description:
      'Alias of version for cross-module consistency. Provide either rowVersion or version.',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
