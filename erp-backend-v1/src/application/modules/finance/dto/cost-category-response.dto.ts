import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for cost category
 */
export class CostCategoryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Construction Materials' })
  name: string;

  @ApiPropertyOptional({
    example: 'All materials used in construction projects',
  })
  description?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  parentId?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    example: 2,
    description: 'Optimistic concurrency row version',
  })
  rowVersion: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Parent category details' })
  parent?: CostCategoryResponseDto;

  @ApiPropertyOptional({
    description: 'Child categories',
    type: [CostCategoryResponseDto],
  })
  children?: CostCategoryResponseDto[];

  @ApiPropertyOptional({
    description: 'Number of child categories',
    example: 5,
  })
  childrenCount?: number;
}

/**
 * Response DTO for list of cost categories with pagination
 */
export class CostCategoryListResponseDto {
  @ApiProperty({ type: [CostCategoryResponseDto] })
  data: CostCategoryResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

/**
 * Simple message response DTO
 */
export class MessageResponseDto {
  @ApiProperty({ example: 'Cost category deleted successfully' })
  message: string;
}
