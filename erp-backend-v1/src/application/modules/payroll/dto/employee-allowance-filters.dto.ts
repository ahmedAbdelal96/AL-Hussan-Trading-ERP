import {
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsIn,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AllowanceFrequency } from '@prisma/client';

/**
 * DTO for filtering and paginating employee allowances
 */
export class EmployeeAllowanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by allowance type ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  allowanceTypeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by frequency',
    example: 'MONTHLY',
    enum: AllowanceFrequency,
  })
  @IsEnum(AllowanceFrequency)
  @IsOptional()
  frequency?: AllowanceFrequency;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by approval status',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'effectiveFrom',
    enum: ['amount', 'effectiveFrom', 'createdAt', 'updatedAt'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['amount', 'effectiveFrom', 'createdAt', 'updatedAt'])
  sortBy?: string = 'effectiveFrom';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
