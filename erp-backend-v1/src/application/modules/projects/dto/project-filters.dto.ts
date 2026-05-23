/**
 * Project Filters DTO
 * Query parameters for filtering and pagination
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsUUID,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus, MediaCategory } from '@prisma/client';

export class ProjectFiltersDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'Construction',
    description: 'Search by project name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, description: 'Filter by status' })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by site ID' })
  @IsUUID()
  @IsOptional()
  siteId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by manager ID' })
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Filter by client name',
  })
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Filter by start date (from)',
  })
  @IsDateString()
  @IsOptional()
  startDateFrom?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Filter by start date (to)',
  })
  @IsDateString()
  @IsOptional()
  startDateTo?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Filter by minimum completion percentage',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  minCompletion?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Filter by maximum completion percentage',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  maxCompletion?: number;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort field',
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sort order',
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    example: false,
    description: 'Include deleted projects',
    default: false,
  })
  @Type(() => Boolean)
  @IsOptional()
  includeDeleted?: boolean = false;
}

export class MediaFiltersDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 50,
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    enum: MediaCategory,
    description: 'Filter by category',
  })
  @IsEnum(MediaCategory)
  @IsOptional()
  category?: MediaCategory;

  @ApiPropertyOptional({
    example: 'Foundation',
    description: 'Search by title or description',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'uploadedAt',
    description: 'Sort field',
    default: 'uploadedAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'uploadedAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sort order',
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
