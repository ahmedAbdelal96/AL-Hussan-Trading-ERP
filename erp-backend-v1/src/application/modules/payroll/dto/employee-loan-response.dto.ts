import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '@prisma/client';

/**
 * Response DTO for employee loan
 */
export class EmployeeLoanResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  employeeId: string;

  @ApiProperty({ example: 10000 })
  amount: number;

  @ApiProperty({ example: 12 })
  installments: number;

  @ApiProperty({ example: 833.33 })
  installmentAmount: number;

  @ApiProperty({ example: 5000 })
  paidAmount: number;

  @ApiProperty({ example: 5000 })
  remainingAmount: number;

  @ApiProperty({ example: 'APPROVED', enum: LoanStatus })
  status: LoanStatus;

  @ApiProperty({ example: 1 })
  rowVersion: number;

  @ApiProperty({ example: '2024-02-01T00:00:00Z' })
  startDate: Date;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z' })
  endDate?: Date;

  @ApiPropertyOptional({ example: 'Emergency loan for medical expenses' })
  notes?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  approvedBy?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  approvedAt?: Date;

  @ApiPropertyOptional({ example: 'Approved by manager' })
  approvalNotes?: string;

  @ApiPropertyOptional({ example: 'Insufficient tenure' })
  rejectionReason?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

/**
 * Response DTO for list of employee loans with pagination
 */
export class EmployeeLoanListResponseDto {
  @ApiProperty({ type: [EmployeeLoanResponseDto] })
  data: EmployeeLoanResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
