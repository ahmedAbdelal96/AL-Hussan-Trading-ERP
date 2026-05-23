/**
 * Update Asset DTO
 * Validates asset update request
 * All fields are optional (partial update)
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsNumber,
  IsDateString,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { AssetType, AssetStatus } from '@prisma/client';

export class UpdateAssetDto {
  @ApiPropertyOptional({
    description: 'Asset name',
    example: 'Toyota Hilux 2020',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Asset type',
    enum: AssetType,
    example: 'VEHICLE',
  })
  @IsEnum(AssetType)
  @IsOptional()
  assetType?: AssetType;

  @ApiPropertyOptional({
    description: 'Asset status',
    enum: AssetStatus,
    example: 'AVAILABLE',
  })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @ApiPropertyOptional({
    description: 'Asset category',
    example: 'Heavy Equipment',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  // Manufacturer Info
  @ApiPropertyOptional({
    description: 'Manufacturer name',
    example: 'Toyota',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Model',
    example: 'Hilux 4x4',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({
    description: 'Serial number',
    example: 'SN123456789',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({
    description: 'Year of manufacture',
    example: 2020,
  })
  @IsNumber()
  @IsOptional()
  @Min(1900)
  yearOfManufacture?: number;

  // Purchase Info
  @ApiPropertyOptional({
    description: 'Purchase date',
    example: '2020-01-15',
  })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({
    description: 'Purchase price',
    example: 150000.0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({
    description: 'Vendor name',
    example: 'Abdul Latif Jameel',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Warranty expiry date',
    example: '2025-01-15',
  })
  @IsDateString()
  @IsOptional()
  warrantyExpiry?: string;

  // Vehicle Specific
  @ApiPropertyOptional({
    description: 'License plate number (for vehicles)',
    example: 'ABC-123',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  licensePlate?: string;

  @ApiPropertyOptional({
    description: 'Chassis number (for vehicles)',
    example: 'CHASSIS123456',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  chassisNumber?: string;

  @ApiPropertyOptional({
    description: 'Engine number (for vehicles)',
    example: 'ENGINE789012',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  engineNumber?: string;

  @ApiPropertyOptional({
    description: 'Color',
    example: 'White',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({
    description: 'Fuel type (for vehicles)',
    example: 'Diesel',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  fuelType?: string;

  // Current Status
  @ApiPropertyOptional({
    description: 'Current location',
    example: 'Main Warehouse',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  currentLocation?: string;

  @ApiPropertyOptional({
    description: 'Current odometer reading (for vehicles)',
    example: 50000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  currentOdometer?: number;

  // Specifications (JSON)
  @ApiPropertyOptional({
    description: 'Additional specifications as JSON object',
    example: { engine: '2.8L Turbo Diesel', transmission: 'Automatic' },
  })
  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Heavy-duty pickup truck for construction sites',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Equipped with GPS tracking',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Current row version for optimistic concurrency control. If stale, backend returns 409.',
    example: 5,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
