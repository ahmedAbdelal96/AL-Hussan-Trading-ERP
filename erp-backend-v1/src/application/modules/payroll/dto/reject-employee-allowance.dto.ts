import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for rejecting an employee allowance
 */
export class RejectEmployeeAllowanceDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Budget constraints for this quarter',
  })
  @IsString()
  @IsNotEmpty()
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
