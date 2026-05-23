import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for cost allocation
 * Used when returning allocation data from API
 *
 * Design Decision:
 * - Always returns BOTH amount AND percentage (calculated if needed)
 * - This gives frontend maximum flexibility for display
 * - Includes project details for easy reference without extra queries
 *
 * @class CostAllocationResponseDto
 */
export class CostAllocationResponseDto {
  /**
   * Unique allocation ID
   */
  @ApiProperty({
    description: 'Allocation unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  /**
   * Parent cost ID
   */
  @ApiProperty({
    description: 'Parent cost ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  costId: string;

  /**
   * Project ID this cost is allocated to
   */
  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId: string;

  /**
   * Allocated amount in SAR
   * Always present, even if original input was percentage-based
   */
  @ApiProperty({
    description: 'Allocated amount in SAR',
    example: 5000.5,
  })
  allocatedAmount: number;

  /**
   * Percentage of total cost (0-100)
   * Always present, even if original input was amount-based
   * Calculated as: (allocatedAmount / totalCost) * 100
   */
  @ApiProperty({
    description: 'Percentage of total cost',
    example: 62.5,
    minimum: 0,
    maximum: 100,
  })
  percentage: number;

  /**
   * Optional notes for this allocation
   */
  @ApiPropertyOptional({
    description: 'Allocation notes',
    example: 'Initial phase materials',
  })
  notes?: string;

  /**
   * Timestamp when allocation was created
   */
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  /**
   * Timestamp when allocation was last updated
   */
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  /**
   * Related project details (optional, only if included)
   * Prevents N+1 queries by including commonly needed project info
   */
  @ApiPropertyOptional({
    description: 'Related project details',
  })
  project?: {
    id: string;
    projectCode: string;
    name: string;
    status: string;
  };
}

/**
 * Response DTO for list of allocations with summary
 * Useful for displaying allocation breakdown with totals
 *
 * @class CostAllocationsListResponseDto
 */
export class CostAllocationsListResponseDto {
  /**
   * Cost ID these allocations belong to
   */
  @ApiProperty({
    description: 'Parent cost ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  costId: string;

  /**
   * Total cost amount (sum of all allocations should equal this)
   */
  @ApiProperty({
    description: 'Total cost amount',
    example: 10000.0,
  })
  totalAmount: number;

  /**
   * Number of projects this cost is allocated to
   */
  @ApiProperty({
    description: 'Number of projects',
    example: 3,
  })
  projectCount: number;

  /**
   * List of allocations
   */
  @ApiProperty({
    description: 'List of cost allocations',
    type: [CostAllocationResponseDto],
  })
  allocations: CostAllocationResponseDto[];

  /**
   * Validation status
   * Indicates if allocations are valid (sum = 100% and sum = totalAmount)
   */
  @ApiProperty({
    description: 'Whether allocations are valid',
    example: true,
  })
  isValid: boolean;

  /**
   * Validation messages (if any issues found)
   */
  @ApiPropertyOptional({
    description: 'Validation messages',
    example: [],
  })
  validationMessages?: string[];
}
