import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  MaintenanceStatus,
  MaintenanceType,
  MaintenancePriority,
} from '@prisma/client';

const toInteger = (value: unknown, fallback: number): number => {
  const normalized =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;

  return Number.isNaN(normalized) ? fallback : normalized;
};

/**
 * DTO for filtering and paginating maintenance requests
 */
export class MaintenanceFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by asset ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional({
    description: 'Filter by project ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by maintenance type',
    enum: MaintenanceType,
    example: MaintenanceType.PREVENTIVE,
  })
  @IsEnum(MaintenanceType)
  @IsOptional()
  maintenanceType?: MaintenanceType;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: MaintenancePriority,
    example: MaintenancePriority.HIGH,
  })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: MaintenanceStatus,
    example: MaintenanceStatus.IN_PROGRESS,
  })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiPropertyOptional({
    description: 'Filter by assigned user ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date from (ISO 8601)',
    example: '2026-01-01',
  })
  @IsDateString()
  @IsOptional()
  scheduledDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled date to (ISO 8601)',
    example: '2026-01-31',
  })
  @IsDateString()
  @IsOptional()
  scheduledDateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
  })
  @Transform(({ value }) => toInteger(value, 1))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @Transform(({ value }) => toInteger(value, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
