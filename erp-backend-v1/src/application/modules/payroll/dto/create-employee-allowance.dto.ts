import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AllowanceFrequency } from '@prisma/client';

/**
 * DTO for creating a new employee allowance
 */
export class CreateEmployeeAllowanceDto {
  @ApiProperty({
    description: 'Employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Allowance type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  allowanceTypeId: string;

  @ApiPropertyOptional({
    description:
      'Allowance amount. If omitted, the allowance type default amount will be used',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiProperty({
    description: 'Allowance frequency',
    example: 'MONTHLY',
    enum: AllowanceFrequency,
  })
  @IsEnum(AllowanceFrequency)
  @IsNotEmpty()
  frequency: AllowanceFrequency;

  @ApiProperty({
    description: 'Effective from date (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  effectiveFrom: string;

  @ApiPropertyOptional({
    description: 'Effective to date (ISO 8601 format)',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional({
    description: 'Whether the allowance is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Standard housing allowance',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
