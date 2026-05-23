import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentRole } from '@prisma/client';

export class AssignEmployeeToProjectDto {
  @ApiProperty({
    description: 'Employee ID to assign to the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiPropertyOptional({
    description: 'Role of the employee in this project',
    enum: AssignmentRole,
    example: AssignmentRole.ENGINEER,
  })
  @IsEnum(AssignmentRole)
  @IsOptional()
  role?: AssignmentRole;

  @ApiPropertyOptional({
    description:
      'Salary allocation percentage for this project (0–100). ' +
      'Null means employee is overhead (salary not allocated to projects). ' +
      'Sum of all active assignment percentages for the employee must equal 100.',
    example: 60,
    minimum: 0.01,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  @IsOptional()
  percentage?: number;

  @ApiPropertyOptional({
    description: 'Date when assignment starts (ISO 8601 date)',
    example: '2026-01-01',
  })
  @IsDateString()
  @IsOptional()
  assignedDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
