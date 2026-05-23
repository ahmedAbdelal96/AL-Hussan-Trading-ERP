import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentRole } from '@prisma/client';

export class ProjectEmployeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty({ description: 'Employee full name' })
  employeeName: string;

  @ApiProperty({ description: 'Employee number' })
  employeeNumber: string;

  @ApiPropertyOptional({ description: 'Employee department' })
  department: string | null;

  @ApiPropertyOptional({ description: 'Employee position' })
  position: string | null;

  @ApiPropertyOptional({ enum: AssignmentRole })
  role: AssignmentRole | null;

  @ApiPropertyOptional({
    description:
      'Salary allocation percentage for this project. Null = overhead employee.',
  })
  percentage: number | null;

  @ApiProperty()
  assignedDate: Date;

  @ApiPropertyOptional()
  endDate: Date | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiProperty()
  createdAt: Date;
}
