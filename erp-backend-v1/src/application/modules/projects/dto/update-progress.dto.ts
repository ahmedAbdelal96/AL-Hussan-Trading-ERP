/**
 * Update Progress DTO
 * Validation for updating project progress
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({
    example: 45.5,
    description: 'Completion percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;

  @ApiPropertyOptional({
    example: 'Foundation work completed, starting on first floor structure',
    description: 'Progress notes',
  })
  @IsString()
  @IsOptional()
  progressNotes?: string;
}
