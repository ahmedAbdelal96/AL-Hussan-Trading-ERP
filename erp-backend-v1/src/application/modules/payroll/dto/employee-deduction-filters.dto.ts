import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsIn,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeductionType, DeductionStatus } from '@prisma/client';

/**
 * DTO for filtering and paginating employee deductions
 */
export class EmployeeDeductionFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by employee ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by deduction type',
    example: 'INSURANCE',
    enum: DeductionType,
  })
  @IsEnum(DeductionType)
  @IsOptional()
  deductionType?: DeductionType;

  @ApiPropertyOptional({
    description: 'Filter by loan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    example: 'PENDING',
    enum: DeductionStatus,
  })
  @IsEnum(DeductionStatus)
  @IsOptional()
  status?: DeductionStatus;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO 8601 format)',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

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
    example: 'deductionDate',
    enum: [
      'amount',
      'deductionDate',
      'deductionType',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsString()
  @IsOptional()
  @IsIn(['amount', 'deductionDate', 'deductionType', 'createdAt', 'updatedAt'])
  sortBy?: string = 'deductionDate';

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
