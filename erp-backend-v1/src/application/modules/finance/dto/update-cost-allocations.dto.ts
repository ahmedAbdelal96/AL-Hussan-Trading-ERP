import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CostAllocationInputDto } from './cost-allocation-input.dto';

/**
 * DTO for updating cost allocations
 *
 * Design Decision:
 * - Replaces ALL existing allocations (not partial update)
 * - This prevents inconsistencies and simplifies logic
 * - Frontend sends complete new allocation set
 * - Backend validates and replaces atomically in transaction
 *
 * Why full replacement?
 * 1. Ensures sum always equals 100% / total amount
 * 2. Prevents orphaned allocations
 * 3. Simpler business logic (no diff calculation needed)
 * 4. Better audit trail (clear before/after states)
 *
 * @class UpdateCostAllocationsDto
 */
export class UpdateCostAllocationsDto {
  /**
   * Complete new set of allocations
   *
   * Validation Rules:
   * - Minimum 2 projects (single project = use projectId directly)
   * - Each allocation must be valid (see CostAllocationInputDto)
   * - Sum must equal 100% OR total cost amount
   */
  @ApiProperty({
    description: 'Complete new set of cost allocations (replaces existing)',
    type: [CostAllocationInputDto],
    example: [
      {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        percentage: 40,
        notes: 'Project A share',
      },
      {
        projectId: '223e4567-e89b-12d3-a456-426614174000',
        percentage: 35,
        notes: 'Project B share',
      },
      {
        projectId: '323e4567-e89b-12d3-a456-426614174000',
        percentage: 25,
        notes: 'Project C share',
      },
    ],
  })
  @IsArray({ message: 'التوزيعات يجب أن تكون مصفوفة' })
  @ArrayMinSize(2, { message: 'يجب توزيع التكلفة على مشروعين على الأقل' })
  @ValidateNested({ each: true })
  @Type(() => CostAllocationInputDto)
  allocations: CostAllocationInputDto[];

  @ApiProperty({
    required: false,
    description:
      'Current row version for optimistic concurrency control. If stale, update fails with 409.',
    example: 5,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
