import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    example: 'IT',
    description: 'Unique department code (uppercase letters, numbers, hyphens)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message:
      'Code must contain only uppercase letters, numbers, underscores, and hyphens',
  })
  code: string;

  @ApiProperty({
    example: 'تقنية المعلومات',
    description: 'Department name in Arabic',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nameAr: string;

  @ApiProperty({
    example: 'Information Technology',
    description: 'Department name in English',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nameEn: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
