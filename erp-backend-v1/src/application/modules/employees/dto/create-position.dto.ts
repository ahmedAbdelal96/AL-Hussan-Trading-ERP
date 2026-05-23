import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PositionLevel {
  EXECUTIVE = 'executive',
  SENIOR = 'senior',
  MID = 'mid',
  JUNIOR = 'junior',
}

export class CreatePositionDto {
  @ApiProperty({ example: 'IT_MGR', description: 'Unique position code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message:
      'Code must contain only uppercase letters, numbers, underscores, and hyphens',
  })
  code: string;

  @ApiProperty({ example: 'مدير تقنية المعلومات' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nameAr: string;

  @ApiProperty({ example: 'IT Manager' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nameEn: string;

  @ApiProperty({ enum: PositionLevel, example: PositionLevel.SENIOR })
  @IsEnum(PositionLevel)
  level: PositionLevel;

  @ApiPropertyOptional({ example: 'uuid-of-department' })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
