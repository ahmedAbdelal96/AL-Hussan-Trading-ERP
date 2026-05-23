import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsString,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentRole } from '@prisma/client';

export class UpdateProjectEmployeeDto {
  @ApiPropertyOptional({
    description: 'Role of the employee in this project',
    enum: AssignmentRole,
    example: AssignmentRole.SUPERVISOR,
  })
  @IsEnum(AssignmentRole)
  @IsOptional()
  role?: AssignmentRole;

  @ApiPropertyOptional({
    description:
      'Salary allocation percentage for this project (0–100). ' +
      'Set to null to make employee overhead (salary not allocated to projects).',
    example: 40,
    minimum: 0.01,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  @IsOptional()
  percentage?: number;

  @ApiPropertyOptional({
    description: 'End date to deactivate the assignment (ISO 8601 date)',
    example: '2026-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Whether the assignment is active',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
