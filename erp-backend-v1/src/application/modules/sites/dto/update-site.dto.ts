import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CreateSiteDto } from './create-site.dto';

export class UpdateSiteDto extends PartialType(CreateSiteDto) {
  @ApiPropertyOptional({
    example: 2,
    description:
      'Current row version for optimistic concurrency control. If stale, backend returns 409.',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
