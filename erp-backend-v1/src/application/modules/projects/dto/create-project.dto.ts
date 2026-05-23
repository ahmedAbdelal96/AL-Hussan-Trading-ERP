/**
 * Create Project DTO
 * Validation for creating a new project
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsEmail,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Construction Project A',
    description: 'Project name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

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
    enum: ProjectStatus,
    example: ProjectStatus.PLANNING,
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

  @ApiPropertyOptional({ example: 1000000.0, description: 'Project budget' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Project manager employee ID',
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
}
