/**
 * Assign Asset to Project DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class AssignAssetToProjectDto {
  @ApiProperty({ description: 'Project ID', example: 'uuid-here' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({
    description: 'Assignment date',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsOptional()
  assignedDate?: string;

  @ApiPropertyOptional({
    description: 'Asset location at project',
    example: 'Project Site A',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReturnAssetFromProjectDto {
  @ApiPropertyOptional({ description: 'Return date', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  returnDate?: string;

  @ApiPropertyOptional({ description: 'Notes about asset condition on return' })
  @IsString()
  @IsOptional()
  notes?: string;
}
