import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new allowance type
 */
export class CreateAllowanceTypeDto {
  @ApiProperty({
    description: 'Allowance type name',
    example: 'بدل سكن',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Allowance type description',
    example: 'Monthly housing allowance for employees',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Default allowance amount used as a template when assigning to employees',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  defaultAmount?: number;

  @ApiPropertyOptional({
    description: 'Whether the allowance type is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
