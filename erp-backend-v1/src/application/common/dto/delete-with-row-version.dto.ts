import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Optional optimistic lock token for delete requests.
 * If provided, backend will delete only when current rowVersion matches.
 */
export class DeleteWithRowVersionDto {
  @ApiPropertyOptional({
    description:
      'Current row version from UI; when provided enables optimistic delete lock',
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rowVersion?: number;
}
