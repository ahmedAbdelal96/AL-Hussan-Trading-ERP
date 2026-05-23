/**
 * Update Project DTO
 * Validation for updating an existing project
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsEmail,
  IsUUID,
  Min,
  Max,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Construction Project A',
    description: 'Project name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'TN-2024-001', description: 'Tender number' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  tenderNumber?: string;

  @ApiPropertyOptional({
    example: 'A residential construction project',
    description: 'Project description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Client name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientName?: string;

  @ApiPropertyOptional({
    example: '+201501234567',
    description: 'Client phone number',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  clientPhone?: string;

  @ApiPropertyOptional({
    example: 'client@example.com',
    description: 'Client email',
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  clientEmail?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Site ID (optional)' })
  @IsUUID()
  @IsOptional()
  siteId?: string;

  @ApiPropertyOptional({
    example: 'https://maps.google.com/?q=24.7136,46.6753',
    description: 'Google Maps link for project location',
  })
  @IsString()
  @IsOptional()
  googleMapsLink?: string;

  @ApiPropertyOptional({
    example: 'Riyadh, المملكه العربيه السعوديه',
    description: 'Project location',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ example: 24.7136, description: 'Latitude coordinate' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    example: 46.6753,
    description: 'Longitude coordinate',
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
    description: 'Project status',
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Planned start date',
  })
  @IsDateString()
  @IsOptional()
  plannedStartDate?: string;

  @ApiPropertyOptional({
    example: '2024-01-15',
    description: 'Actual start date',
  })
  @IsDateString()
  @IsOptional()
  actualStartDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Planned end date',
  })
  @IsDateString()
  @IsOptional()
  plannedEndDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-25',
    description: 'Actual end date',
  })
  @IsDateString()
  @IsOptional()
  actualEndDate?: string;

  @ApiPropertyOptional({ example: 1000000.0, description: 'Project budget' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ example: 'SAR', description: 'Currency code' })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  @IsIn(['SAR'])
  currency?: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Project manager user ID',
  })
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({
    example: 'Additional project notes',
    description: 'Notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 75.5,
    description: 'Project completion percentage (0-100)',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  completionPercentage?: number;

  @ApiPropertyOptional({
    example: 'Completed foundation work, starting on walls',
    description: 'Progress notes',
  })
  @IsString()
  @IsOptional()
  progressNotes?: string;

  @ApiPropertyOptional({
    example: '2024-01-28T10:30:00.000Z',
    description: 'Last progress update timestamp',
  })
  @IsDateString()
  @IsOptional()
  lastProgressUpdate?: string;

  @ApiPropertyOptional({
    example: 3,
    description:
      'Current row version for optimistic concurrency control. If provided and stale, update fails with 409.',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
