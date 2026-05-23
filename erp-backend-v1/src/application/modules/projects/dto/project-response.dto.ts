/**
 * Project Response DTO
 * Response format for project data
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, MediaCategory } from '@prisma/client';

export class SiteBasicInfoDto {
  @ApiProperty({ example: 'uuid', description: 'Site ID' })
  id: string;

  @ApiProperty({ example: 'Main Construction Site', description: 'Site name' })
  name: string;

  @ApiProperty({ example: 'SITE-001', description: 'Site code' })
  code: string;

  @ApiPropertyOptional({ example: 'Riyadh', description: 'City' })
  city?: string;

  @ApiPropertyOptional({ example: 'Riyadh Region', description: 'State' })
  state?: string | null;

  @ApiProperty({ example: 'ACTIVE', description: 'Site status' })
  status: string;
}

export class ProjectResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Project ID' })
  id: string;

  @ApiProperty({
    example: 'PRJ-0001',
    description: 'Auto-generated project code',
  })
  projectCode: string;

  @ApiProperty({
    example: 'Construction Project A',
    description: 'Project name',
  })
  name: string;

  @ApiPropertyOptional({ example: 'TN-2024-001', description: 'Tender number' })
  tenderNumber?: string | null;

  @ApiPropertyOptional({
    example: 'A residential construction project',
    description: 'Project description',
  })
  description?: string | null;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Client name' })
  clientName?: string | null;

  @ApiPropertyOptional({
    example: '+201501234567',
    description: 'Client phone number',
  })
  clientPhone?: string | null;

  @ApiPropertyOptional({
    example: 'client@example.com',
    description: 'Client email',
  })
  clientEmail?: string | null;

  @ApiPropertyOptional({ example: 'uuid', description: 'Site ID' })
  siteId?: string | null;

  @ApiPropertyOptional({
    type: () => SiteBasicInfoDto,
    description: 'Site information',
  })
  site?: SiteBasicInfoDto | null;

  @ApiPropertyOptional({
    example: 'https://maps.google.com/?q=24.7136,46.6753',
    description: 'Google Maps link',
  })
  googleMapsLink?: string | null;

  @ApiPropertyOptional({
    example: 'Riyadh, المملكه العربيه السعوديه',
    description: 'Project location',
  })
  location?: string | null;

  @ApiPropertyOptional({ example: 24.7136, description: 'Latitude coordinate' })
  latitude?: number | null;

  @ApiPropertyOptional({
    example: 46.6753,
    description: 'Longitude coordinate',
  })
  longitude?: number | null;

  @ApiProperty({
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
    description: 'Project status',
  })
  status: ProjectStatus;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Planned start date',
  })
  plannedStartDate?: string | null;

  @ApiPropertyOptional({
    example: '2024-01-15',
    description: 'Actual start date',
  })
  actualStartDate?: string | null;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Planned end date',
  })
  plannedEndDate?: string | null;

  @ApiPropertyOptional({
    example: '2024-12-25',
    description: 'Actual end date',
  })
  actualEndDate?: string | null;

  @ApiPropertyOptional({ example: 1000000.0, description: 'Project budget' })
  budget?: number | null;

  @ApiProperty({ example: 'SAR', description: 'Currency code' })
  currency: string;

  @ApiProperty({ example: 45.5, description: 'Completion percentage' })
  completionPercentage: number;

  @ApiPropertyOptional({
    example: 'Foundation work completed',
    description: 'Progress notes',
  })
  progressNotes?: string | null;

  @ApiPropertyOptional({
    example: '2024-01-20T10:00:00Z',
    description: 'Last progress update',
  })
  lastProgressUpdate?: string | null;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Project manager user ID',
  })
  managerId?: string | null;

  @ApiPropertyOptional({
    example: 'Additional project notes',
    description: 'Notes',
  })
  notes?: string | null;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00Z',
    description: 'Deletion timestamp',
  })
  deletedAt?: string | null;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'User who deleted the project',
  })
  deletedBy?: string | null;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-01-15T10:00:00Z',
    description: 'Last update timestamp',
  })
  updatedAt: string;

  @ApiProperty({ example: 'uuid', description: 'User who created the project' })
  createdBy: string;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'User who last updated the project',
  })
  updatedBy?: string | null;

  @ApiPropertyOptional({
    example: 5,
    description: 'Number of employees assigned to the project',
  })
  employeeCount?: number;

  @ApiProperty({
    example: 4,
    description: 'Optimistic concurrency row version',
  })
  rowVersion: number;
}

export class ProjectMediaResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Media ID' })
  id: string;

  @ApiProperty({ example: 'uuid', description: 'Project ID' })
  projectId: string;

  @ApiProperty({ example: 'photo_12345.jpg', description: 'Stored file name' })
  fileName: string;

  @ApiProperty({
    example: 'Progress Photo.jpg',
    description: 'Original file name',
  })
  originalName: string;

  @ApiProperty({
    example: '/uploads/projects/photo_12345.jpg',
    description: 'File path',
  })
  filePath: string;

  @ApiProperty({ example: 2048576, description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type' })
  mimeType: string;

  @ApiProperty({
    enum: MediaCategory,
    example: MediaCategory.PROGRESS_PHOTO,
    description: 'Media category',
  })
  category: MediaCategory;

  @ApiPropertyOptional({
    example: 'Foundation Progress - Week 3',
    description: 'Media title',
  })
  title?: string | null;

  @ApiPropertyOptional({
    example: 'Photo showing foundation concrete work',
    description: 'Media description',
  })
  description?: string | null;

  @ApiPropertyOptional({ example: 24.7136, description: 'Latitude coordinate' })
  latitude?: number | null;

  @ApiPropertyOptional({
    example: 46.6753,
    description: 'Longitude coordinate',
  })
  longitude?: number | null;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00Z',
    description: 'When photo was captured',
  })
  capturedAt?: string | null;

  @ApiPropertyOptional({ example: 1, description: 'Display order' })
  displayOrder?: number | null;

  @ApiPropertyOptional({
    example: '2024-02-01T00:00:00Z',
    description: 'Deletion timestamp',
  })
  deletedAt?: string | null;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'User who deleted the media',
  })
  deletedBy?: string | null;

  @ApiProperty({ example: 'uuid', description: 'User who uploaded the media' })
  uploadedBy: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Upload timestamp',
  })
  uploadedAt: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Last update timestamp',
  })
  updatedAt: string;
}

export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectResponseDto], description: 'List of projects' })
  data: ProjectResponseDto[];

  @ApiProperty({ example: 100, description: 'Total count of projects' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page' })
  page: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit: number;
}

export class MessageResponseDto {
  @ApiProperty({
    example: 'Operation successful',
    description: 'Response message',
  })
  message: string;
}
