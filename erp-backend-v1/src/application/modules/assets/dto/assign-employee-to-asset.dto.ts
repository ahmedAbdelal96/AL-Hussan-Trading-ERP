/**
 * Assign Employee to Asset DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { OperatorRole } from '@prisma/client';

export class AssignEmployeeToAssetDto {
  @ApiProperty({ description: 'Employee ID', example: 'uuid-here' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Assignment type/role',
    enum: OperatorRole,
    example: 'PRIMARY_DRIVER',
  })
  @IsEnum(OperatorRole)
  @IsNotEmpty()
  assignmentType: OperatorRole;

  @ApiProperty({
    description: 'Is this the primary assignment?',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isPrimary: boolean;

  @ApiPropertyOptional({
    description: 'Assignment date',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsOptional()
  assignedDate?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Main driver for this vehicle',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UnassignEmployeeDto {
  @ApiPropertyOptional({ description: 'End date', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Reason for unassignment' })
  @IsString()
  @IsOptional()
  notes?: string;
}
