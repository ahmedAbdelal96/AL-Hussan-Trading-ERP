import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto, PaginationMetaDto } from '../../../common/dto';
import { SiteResponseDto } from './site-response.dto';

export class SitesPaginatedResponseDto extends PaginatedResponseDto<SiteResponseDto> {
  @ApiProperty({ type: [SiteResponseDto] })
  declare data: SiteResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  declare meta: PaginationMetaDto;
}
