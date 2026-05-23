import { PartialType } from '@nestjs/swagger';
import { CreateCostCategoryDto } from './create-cost-category.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * DTO for updating an existing cost category
 * All fields are optional for partial updates
 */
export class UpdateCostCategoryDto extends PartialType(CreateCostCategoryDto) {
  @ApiPropertyOptional({
    description:
      'Current row version for optimistic concurrency control. If stale, backend returns 409.',
    example: 3,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
