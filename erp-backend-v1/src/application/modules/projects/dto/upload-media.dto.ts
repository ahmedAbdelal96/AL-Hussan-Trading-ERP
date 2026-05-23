/**
 * Upload Media DTO
 * Validation for uploading project media
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { MediaCategory } from '@prisma/client';

export class UploadMediaDto {
  @ApiProperty({
    enum: MediaCategory,
    example: MediaCategory.PROGRESS_PHOTO,
    description: 'Media category',
  })
  @IsEnum(MediaCategory)
  category: MediaCategory;

  @ApiPropertyOptional({
    example: 'Foundation Progress - Week 3',
    description: 'Media title',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'Photo showing foundation concrete work',
    description: 'Media description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 24.7136,
    description: 'Latitude coordinate (GPS)',
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    example: 46.6753,
    description: 'Longitude coordinate (GPS)',
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    example: '2024-01-15T10:30:00Z',
    description: 'When photo was captured',
  })
  @IsDateString()
  @IsOptional()
  capturedAt?: string;

  @ApiPropertyOptional({ example: 1, description: 'Display order for sorting' })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}
