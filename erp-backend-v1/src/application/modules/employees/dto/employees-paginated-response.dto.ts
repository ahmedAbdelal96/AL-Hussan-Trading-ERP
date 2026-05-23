import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto, PaginationMetaDto } from '../../../common/dto';
import { EmployeeResponseDto } from './employee-response.dto';

export class EmployeesPaginatedResponseDto extends PaginatedResponseDto<EmployeeResponseDto> {
  @ApiProperty({ type: [EmployeeResponseDto] })
  declare data: EmployeeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  declare meta: PaginationMetaDto;
}
