import { ApiProperty } from '@nestjs/swagger';
import { PositionLevel } from './create-position.dto';

export class PositionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  nameAr: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty({ enum: PositionLevel })
  level: string;

  @ApiProperty({ required: false })
  departmentId?: string | null;

  @ApiProperty({ required: false })
  departmentNameEn?: string | null;

  @ApiProperty({ required: false })
  departmentNameAr?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  rowVersion: number;

  @ApiProperty({ required: false })
  _count?: { employees: number };
}

export class PositionsPaginatedResponseDto {
  @ApiProperty({ type: [PositionResponseDto] })
  data: PositionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}
