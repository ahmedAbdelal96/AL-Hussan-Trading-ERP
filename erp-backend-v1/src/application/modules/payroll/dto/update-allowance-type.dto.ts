import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an allowance type
 */
export class UpdateAllowanceTypeDto {
  @ApiPropertyOptional({
    description: 'Allowance type name',
    example: 'بدل سكن',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Allowance type description',
    example: 'Monthly housing allowance for employees',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Default allowance amount used as a template when assigning to employees',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  defaultAmount?: number;

  @ApiPropertyOptional({
    description: 'Whether the allowance type is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

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
