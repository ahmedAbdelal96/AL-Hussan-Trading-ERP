import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateSiteDto } from './create-site.dto';

export class BulkCreateSitesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSiteDto)
  sites: CreateSiteDto[];
}
