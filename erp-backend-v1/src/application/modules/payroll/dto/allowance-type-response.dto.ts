import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for allowance type
 */
export class AllowanceTypeResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'بدل سكن' })
  name: string;

  @ApiPropertyOptional({ example: 'Monthly housing allowance for employees' })
  description?: string;

  @ApiPropertyOptional({ example: 500 })
  defaultAmount?: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1 })
  rowVersion: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

/**
 * Response DTO for list of allowance types with pagination
 */
export class AllowanceTypeListResponseDto {
  @ApiProperty({ type: [AllowanceTypeResponseDto] })
  data: AllowanceTypeResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}
