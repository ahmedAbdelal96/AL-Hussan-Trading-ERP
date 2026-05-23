import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceType, MaintenancePriority } from '@prisma/client';

/**
 * DTO for creating a new maintenance request.
 *
 * Note: projectId is intentionally absent. Project cost allocation is derived
 * automatically from the asset's active ProjectAsset records at creation time.
 */
export class CreateMaintenanceRequestDto {
  @ApiProperty({
    description: 'Asset ID for which maintenance is requested',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({
    description: 'Type of maintenance',
    enum: MaintenanceType,
    example: MaintenanceType.PREVENTIVE,
  })
  @IsEnum(MaintenanceType)
  @IsNotEmpty()
  maintenanceType: MaintenanceType;

  @ApiPropertyOptional({
    description: 'Priority level (defaults to MEDIUM)',
    enum: MaintenancePriority,
    example: MaintenancePriority.HIGH,
  })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiProperty({
    description: 'Maintenance request title',
    example: 'Oil change and filter replacement',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the maintenance needed',
    example:
      'Regular maintenance: change engine oil, replace oil filter and air filter',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Scheduled date for maintenance (ISO 8601 format)',
    example: '2026-01-20T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Estimated cost for maintenance',
    example: 1500.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({
    description: 'Vendor or workshop name',
    example: 'ABC Auto Service',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Vendor contact information',
    example: '+201501234567',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  vendorContact?: string;

  @ApiPropertyOptional({
    description: 'User ID of assigned technician/worker',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Current odometer reading (for vehicles)',
    example: 45000,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  odometerReading?: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
