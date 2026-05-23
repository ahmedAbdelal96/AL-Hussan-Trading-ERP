import { PartialType } from '@nestjs/swagger';
import { CreateProjectCostDto } from './create-project-cost.dto';
import { IsEnum, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

/**
 * DTO for updating an existing project cost
 * All fields from CreateProjectCostDto are optional, plus payment status
 */
export class UpdateProjectCostDto extends PartialType(CreateProjectCostDto) {
  @ApiPropertyOptional({
    description: 'Payment status (can be updated separately)',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Paid date (ISO 8601 format)',
    example: '2024-01-20',
  })
  @IsDateString()
  @IsOptional()
  paidDate?: string;

  @ApiPropertyOptional({
    description:
      'Current row version for optimistic concurrency control. If stale, backend returns 409.',
    example: 4,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
