import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MaintenanceType,
  MaintenancePriority,
  MaintenanceStatus,
} from '@prisma/client';

/**
 * A single project allocation override entry.
 * The sum of all percentages across entries must equal exactly 100.
 */
export class AllocationOverrideDto {
  @ApiProperty({
    description: 'Project ID to allocate cost to',
    example: '123e4567-e89b-12d3-a456-426614174010',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: 'Percentage of total cost allocated to this project (0–100)',
    example: 60.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  percentage: number;
}

/**
 * DTO for updating an existing maintenance request.
 *
 * Note: projectId is intentionally absent — project allocation is a snapshot
 * fixed at creation time. To change allocation, transfer the asset via
 * ProjectAsset management and create a new maintenance request.
 *
 * The optional `projectAllocations` field allows overriding the percentage
 * split shown in the confirmation dialog before completing the request.
 * All provided percentages must sum to exactly 100.
 */
export class UpdateMaintenanceRequestDto {
  @ApiPropertyOptional({
    description: 'Type of maintenance',
    enum: MaintenanceType,
    example: MaintenanceType.CORRECTIVE,
  })
  @IsEnum(MaintenanceType)
  @IsOptional()
  maintenanceType?: MaintenanceType;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: MaintenancePriority,
    example: MaintenancePriority.CRITICAL,
  })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiPropertyOptional({
    description: 'Current status of maintenance',
    enum: MaintenanceStatus,
    example: MaintenanceStatus.IN_PROGRESS,
  })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiPropertyOptional({
    description: 'Maintenance request title',
    example: 'Engine repair - Updated',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Scheduled date (ISO 8601 format)',
    example: '2026-01-25T14:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Actual start date/time (ISO 8601 format)',
    example: '2026-01-20T09:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @ApiPropertyOptional({
    description: 'Completion date/time (ISO 8601 format)',
    example: '2026-01-20T15:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @ApiPropertyOptional({
    description: 'Estimated cost',
    example: 2000.0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({
    description: 'Actual cost after completion',
    example: 1850.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  actualCost?: number;

  @ApiPropertyOptional({
    description: 'Vendor or workshop name',
    example: 'XYZ Motors',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Vendor contact information',
    example: '+201509876543',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  vendorContact?: string;

  @ApiPropertyOptional({
    description: 'Assigned technician/worker ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Odometer reading at time of maintenance',
    example: 45250,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  odometerReading?: number;

  @ApiPropertyOptional({
    description: 'Description of work performed',
  })
  @IsString()
  @IsOptional()
  workPerformed?: string;

  @ApiPropertyOptional({
    description: 'List of parts replaced',
    example: 'Oil filter, Air filter, Engine oil (5L)',
  })
  @IsString()
  @IsOptional()
  partsReplaced?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Override project allocation percentages shown in the completion dialog. ' +
      'Must include ALL projects from the original allocation. ' +
      'Percentages must sum to exactly 100. ' +
      'Only applied when transitioning status to COMPLETED.',
    type: [AllocationOverrideDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AllocationOverrideDto)
  @IsOptional()
  projectAllocations?: AllocationOverrideDto[];

  @ApiPropertyOptional({
    example: 6,
    description:
      'Current row version for optimistic concurrency control. If stale, backend returns 409.',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
