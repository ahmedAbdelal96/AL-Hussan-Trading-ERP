import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeductionType, DeductionStatus } from '@prisma/client';
import { EmployeeLoanResponseDto } from './employee-loan-response.dto';

/**
 * Response DTO for employee deduction
 */
export class EmployeeDeductionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  employeeId: string;

  @ApiProperty({ example: 'INSURANCE', enum: DeductionType })
  deductionType: DeductionType;

  @ApiProperty({ example: 500 })
  amount: number;

  @ApiProperty({ example: '2024-01-31T00:00:00Z' })
  deductionDate: Date;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  loanId?: string;

  @ApiProperty({ example: 'PENDING', enum: DeductionStatus })
  status: DeductionStatus;

  @ApiProperty({ example: 1 })
  rowVersion: number;

  @ApiPropertyOptional({ example: 'Health insurance premium' })
  description?: string;

  @ApiPropertyOptional({ example: 'Monthly insurance deduction' })
  notes?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  approvedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  approvedAt?: Date;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  rejectedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  rejectedAt?: Date;

  @ApiPropertyOptional({ example: 'Amount exceeds policy limit' })
  rejectedReason?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Associated loan details (if applicable)',
  })
  loan?: EmployeeLoanResponseDto;
}

/**
 * Response DTO for list of employee deductions with pagination
 */
export class EmployeeDeductionListResponseDto {
  @ApiProperty({ type: [EmployeeDeductionResponseDto] })
  data: EmployeeDeductionResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
