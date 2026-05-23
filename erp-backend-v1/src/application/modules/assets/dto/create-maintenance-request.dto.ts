/**
 * Create Maintenance Request DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { MaintenanceType, MaintenancePriority } from '@prisma/client';

export class CreateMaintenanceRequestDto {
  @ApiProperty({
    description: 'Maintenance title',
    example: 'Regular Oil Change',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Maintenance type',
    enum: MaintenanceType,
    example: 'PREVENTIVE',
  })
  @IsEnum(MaintenanceType)
  @IsNotEmpty()
  maintenanceType: MaintenanceType;

  @ApiProperty({
    description: 'Priority',
    enum: MaintenancePriority,
    example: 'MEDIUM',
  })
  @IsEnum(MaintenancePriority)
  @IsNotEmpty()
  priority: MaintenancePriority;

  @ApiPropertyOptional({ description: 'Description/details' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Scheduled date', example: '2024-02-01' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Estimated cost', example: 1500.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({
    description: 'Vendor/workshop name',
    example: 'Al-Noor Auto Workshop',
  })
  @IsString()
  @IsOptional()
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Vendor contact',
    example: '+201501234567',
  })
  @IsString()
  @IsOptional()
  vendorContact?: string;

  @ApiPropertyOptional({
    description: 'Current odometer reading',
    example: 50000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  odometerReading?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
