/**
 * Asset Filters DTO
 * Query parameters for filtering and pagination
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetType, AssetStatus } from '@prisma/client';

export class AssetFiltersDto {
  @ApiPropertyOptional({
    description: 'Search term (searches in name, assetNumber, licensePlate)',
    example: 'Toyota',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by asset type',
    enum: AssetType,
    example: 'VEHICLE',
  })
  @IsEnum(AssetType)
  @IsOptional()
  assetType?: AssetType;

  @ApiPropertyOptional({
    description: 'Filter by asset status',
    enum: AssetStatus,
    example: 'AVAILABLE',
  })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'Heavy Equipment',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by manufacturer',
    example: 'Toyota',
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Filter by current location',
    example: 'Main Warehouse',
  })
  @IsString()
  @IsOptional()
  currentLocation?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
