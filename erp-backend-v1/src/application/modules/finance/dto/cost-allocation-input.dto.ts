import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for cost allocation input when creating/updating allocated costs
 *
 * Design Decision:
 * - Supports TWO input modes: by amount OR by percentage
 * - User chooses ONE mode per allocation, not both
 * - Validation ensures only one is provided
 *
 * Example Use Cases:
 * 1. By Amount: Project A = 5000 SAR, Project B = 3000 SAR
 * 2. By Percentage: Project A = 60%, Project B = 40%
 *
 * @class CostAllocationInputDto
 */
export class CostAllocationInputDto {
  /**
   * Project ID to allocate cost to
   * Must be a valid UUID from projects table
   */
  @ApiProperty({
    description: 'Project ID to allocate cost to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  /**
   * Allocated amount for this project (Option 1)
   * Use this when user wants to specify exact amounts
   *
   * Validation: Must be > 0 if provided
   * Constraint: Cannot use both amount AND percentage
   */
  @ApiPropertyOptional({
    description:
      'Allocated amount for this project (use either amount OR percentage, not both)',
    example: 5000.5,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'المبلغ المخصص يجب أن يكون أكبر من صفر' })
  @IsOptional()
  @ValidateIf((o) => !o.percentage) // Required if percentage is not provided
  amount?: number;

  /**
   * Allocated percentage for this project (Option 2)
   * Use this when user wants to specify percentages
   *
   * Validation: Must be between 0.01 and 100
   * Constraint: Cannot use both amount AND percentage
   */
  @ApiPropertyOptional({
    description:
      'Allocated percentage for this project (0-100) (use either amount OR percentage)',
    example: 62.5,
    minimum: 0.01,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'النسبة يجب أن تكون أكبر من صفر' })
  @Max(100, { message: 'النسبة يجب ألا تتجاوز 100%' })
  @IsOptional()
  @ValidateIf((o) => !o.amount) // Required if amount is not provided
  percentage?: number;

  /**
   * Optional notes for this specific allocation
   * Useful for explaining why this amount/percentage was allocated
   */
  @ApiPropertyOptional({
    description: 'Optional notes for this allocation',
    example: 'Initial phase materials',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
