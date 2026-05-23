import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto, PaginationMetaDto } from '../../../common/dto';
import { ProjectResponseDto } from './project-response.dto';

export class ProjectsPaginatedResponseDto extends PaginatedResponseDto<ProjectResponseDto> {
  @ApiProperty({ type: [ProjectResponseDto] })
  declare data: ProjectResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  declare meta: PaginationMetaDto;
}
