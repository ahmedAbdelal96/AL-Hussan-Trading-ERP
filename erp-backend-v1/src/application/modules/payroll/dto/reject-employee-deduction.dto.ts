import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for rejecting an employee deduction
 */
export class RejectEmployeeDeductionDto {
  @ApiProperty({
    description: 'Reason for rejection (required for audit trail)',
    example: 'Invalid amount or improper documentation',
  })
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @MinLength(3, { message: 'Rejection reason must be at least 3 characters' })
  rejectionReason: string;

  @ApiPropertyOptional({
    description: 'Expected row version for optimistic concurrency control',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
