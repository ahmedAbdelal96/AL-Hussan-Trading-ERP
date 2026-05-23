import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { SiteStatusDto } from './create-site.dto';

export class SiteFiltersDto extends PaginationQueryDto {
  @IsEnum(SiteStatusDto)
  @IsOptional()
  status?: SiteStatusDto;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  code?: string;
}
