import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsDateString,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CostType } from '@prisma/client';
import { CostAllocationInputDto } from './cost-allocation-input.dto';

/**
 * DTO for creating a new project cost entry
 *
 * Supports 3 types of costs:
 * 1. Single Project Cost: Provide projectId only
 * 2. General Expense: Don't provide projectId or allocations
 * 3. Allocated Cost: Provide allocations array (minimum 2 projects)
 *
 * Validation Rules:
 * - Cannot have both projectId AND allocations (mutually exclusive)
 * - If allocations provided, must have at least 2 projects
 * - If no projectId and no allocations = General Expense
 */
export class CreateProjectCostDto {
  @ApiPropertyOptional({
    description: 'Project ID (for single project costs only)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => !o.allocations || o.allocations.length === 0)
  projectId?: string;

  @ApiProperty({
    description: 'Type of cost',
    enum: CostType,
    example: CostType.MATERIAL,
  })
  @IsEnum(CostType)
  @IsNotEmpty()
  costType: CostType;

  @ApiPropertyOptional({
    description: 'Reference type (e.g., Employee, Asset, Vendor)',
    example: 'Employee',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceType?: string;

  @ApiPropertyOptional({
    description: 'Reference ID (UUID of the referenced entity)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Cost category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description:
      'Final cost amount (total payable amount, tax-inclusive when taxRate is provided)',
    example: 15000.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({
    description:
      'Tax rate percentage (for example: 15 for VAT 15%). Optional, defaults to 0.',
    example: 15,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;

  @ApiProperty({
    description: 'Transaction date (ISO 8601 format)',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  transactionDate: string;

  @ApiProperty({
    description: 'Description of the cost',
    example: 'Purchase of construction materials for Phase 1',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2024-001',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'Bank Transfer',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Payment reference (transaction ID or check number)',
    example: 'TXN-2024-001',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  paymentReference?: string;

  @ApiPropertyOptional({
    description: 'Cost allocations (for multi-project costs)',
    type: [CostAllocationInputDto],
    example: [
      {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        percentage: 40,
        notes: 'Villa project allocation',
      },
      {
        projectId: '987fcdeb-51a2-43f1-b890-123456789abc',
        percentage: 60,
        notes: 'Building project allocation',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CostAllocationInputDto)
  @ValidateIf((o) => !o.projectId)
  allocations?: CostAllocationInputDto[];
}
