import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AllowanceFrequency, AllowanceStatus } from '@prisma/client';
import { AllowanceTypeResponseDto } from './allowance-type-response.dto';

/**
 * Response DTO for employee allowance
 */
export class EmployeeAllowanceResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  employeeId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  allowanceTypeId: string;

  @ApiProperty({ example: 1000 })
  amount: number;

  @ApiProperty({ example: 'MONTHLY', enum: AllowanceFrequency })
  frequency: AllowanceFrequency;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  effectiveFrom: Date;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00Z' })
  effectiveTo?: Date;

  @ApiPropertyOptional({ example: 'Standard housing allowance' })
  notes?: string;

  @ApiProperty({
    example: 'APPROVED',
    enum: AllowanceStatus,
    description: 'Current status of the allowance',
  })
  status: AllowanceStatus;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  approvedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  approvedAt?: Date;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  rejectedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  rejectedAt?: Date;

  @ApiPropertyOptional({ example: 'Budget constraints' })
  rejectionReason?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: 1 })
  rowVersion: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Allowance type details' })
  allowanceType?: AllowanceTypeResponseDto;
}

/**
 * Response DTO for list of employee allowances with pagination
 */
export class EmployeeAllowanceListResponseDto {
  @ApiProperty({ type: [EmployeeAllowanceResponseDto] })
  data: EmployeeAllowanceResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
