/**
 * Update Maintenance Request DTO
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import {
  MaintenanceType,
  MaintenancePriority,
  MaintenanceStatus,
} from '@prisma/client';

export class UpdateMaintenanceRequestDto {
  @ApiPropertyOptional({ description: 'Maintenance title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Maintenance type',
    enum: MaintenanceType,
  })
  @IsEnum(MaintenanceType)
  @IsOptional()
  maintenanceType?: MaintenanceType;

  @ApiPropertyOptional({ description: 'Priority', enum: MaintenancePriority })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiPropertyOptional({ description: 'Status', enum: MaintenanceStatus })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Scheduled date', example: '2024-02-01' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Start datetime',
    example: '2024-02-01T09:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @ApiPropertyOptional({
    description: 'Completion datetime',
    example: '2024-02-01T15:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @ApiPropertyOptional({ description: 'Estimated cost', example: 1500.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Actual cost', example: 1650.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  actualCost?: number;

  @ApiPropertyOptional({ description: 'Vendor name' })
  @IsString()
  @IsOptional()
  vendor?: string;

  @ApiPropertyOptional({ description: 'Vendor contact' })
  @IsString()
  @IsOptional()
  vendorContact?: string;

  @ApiPropertyOptional({ description: 'Odometer reading' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  odometerReading?: number;

  @ApiPropertyOptional({ description: 'Work performed description' })
  @IsString()
  @IsOptional()
  workPerformed?: string;

  @ApiPropertyOptional({ description: 'Parts replaced list' })
  @IsString()
  @IsOptional()
  partsReplaced?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
