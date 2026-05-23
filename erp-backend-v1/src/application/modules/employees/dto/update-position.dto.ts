import { PartialType } from '@nestjs/swagger';
import { CreatePositionDto } from './create-position.dto';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdatePositionDto extends PartialType(CreatePositionDto) {
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
