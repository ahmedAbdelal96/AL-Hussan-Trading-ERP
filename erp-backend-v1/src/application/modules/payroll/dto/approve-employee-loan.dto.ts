import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for approving an employee loan
 */
export class ApproveEmployeeLoanDto {
  @ApiPropertyOptional({
    description: 'Approval notes',
    example: 'Approved by HR manager',
  })
  @IsString()
  @IsOptional()
  notes?: string;

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
