/**
 * Asset Response DTO
 * Standardized response format for asset data
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType, AssetStatus } from '@prisma/client';

export class AssetResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'AST-2024-001' })
  assetNumber: string;

  @ApiProperty({ example: 'Toyota Hilux 2020' })
  name: string;

  @ApiProperty({ enum: AssetType, example: 'VEHICLE' })
  assetType: AssetType;

  @ApiPropertyOptional({ example: 'Heavy Equipment' })
  category?: string | null;

  // Manufacturer Info
  @ApiPropertyOptional({ example: 'Toyota' })
  manufacturer?: string | null;

  @ApiPropertyOptional({ example: 'Hilux 4x4' })
  model?: string | null;

  @ApiPropertyOptional({ example: 'SN123456789' })
  serialNumber?: string | null;

  @ApiPropertyOptional({ example: 2020 })
  yearOfManufacture?: number | null;

  // Purchase Info
  @ApiPropertyOptional({ example: '2020-01-15' })
  purchaseDate?: Date | null;

  @ApiPropertyOptional({ example: 150000.0 })
  purchasePrice?: number | null;

  @ApiPropertyOptional({ example: 'Abdul Latif Jameel' })
  vendor?: string | null;

  @ApiPropertyOptional({ example: '2025-01-15' })
  warrantyExpiry?: Date | null;

  // Vehicle Specific
  @ApiPropertyOptional({ example: 'ABC-123' })
  licensePlate?: string | null;

  @ApiPropertyOptional({ example: 'CHASSIS123456' })
  chassisNumber?: string | null;

  @ApiPropertyOptional({ example: 'ENGINE789012' })
  engineNumber?: string | null;

  @ApiPropertyOptional({ example: 'White' })
  color?: string | null;

  @ApiPropertyOptional({ example: 'Diesel' })
  fuelType?: string | null;

  // Current Status
  @ApiProperty({ enum: AssetStatus, example: 'AVAILABLE' })
  status: AssetStatus;

  @ApiPropertyOptional({ example: 'Main Warehouse' })
  currentLocation?: string | null;

  @ApiPropertyOptional({ example: 50000 })
  currentOdometer?: number | null;

  // Specifications
  @ApiPropertyOptional({ example: { engine: '2.8L Turbo Diesel' } })
  specifications?: any;

  @ApiPropertyOptional({ example: 'Heavy-duty pickup truck' })
  description?: string | null;

  @ApiPropertyOptional({ example: 'GPS equipped' })
  notes?: string | null;

  // Audit
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-10T00:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'uuid-here' })
  createdBy: string;

  @ApiPropertyOptional({ example: 'uuid-here' })
  updatedBy?: string | null;

  @ApiProperty({
    example: 8,
    description: 'Optimistic concurrency row version',
  })
  rowVersion: number;
}

export class AssetListResponseDto {
  @ApiProperty({ type: [AssetResponseDto] })
  data: AssetResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation successful' })
  message: string;
}
