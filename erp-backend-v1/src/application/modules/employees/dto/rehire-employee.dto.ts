import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RehireEmployeeDto {
  @ApiProperty({
    description: 'Date of rehire (ISO date string)',
    example: '2026-03-01',
  })
  @IsDateString()
  @IsNotEmpty()
  rehireDate: string;

  @ApiPropertyOptional({
    description: 'Reason or notes for rehire',
    example: 'Rehired for new project',
  })
  @IsString()
  @IsOptional()
  rehireReason?: string;

  @ApiPropertyOptional({
    description: 'New base salary (if different from previous)',
    example: 12000,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  baseSalary?: number;

  @ApiPropertyOptional({
    description: 'New department ID (if changed)',
  })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'New position ID (if changed)',
  })
  @IsUUID()
  @IsOptional()
  positionId?: string;
}
